import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  Notifier,
  createNotifier,
  formatDeploymentMessage,
  type NotificationChannel,
  type DeploymentNotification,
} from '../notifier';
import type { DeploymentStatus } from '../deployment-tracker';

// Mock fetch
global.fetch = vi.fn();

describe('notifier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Notifier', () => {
    describe('GitHub notifications', () => {
      it('should send deployment start notification', async () => {
        const notifier = new Notifier({
          github: { enabled: true, token: 'test-token', repo: 'owner/repo' },
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 1 }),
        } as Response);

        const notification: DeploymentNotification = {
          deploymentId: 'deploy-1',
          status: 'in_progress',
          message: 'Deployment started',
          prNumber: 123,
        };

        await notifier.notify(notification);

        expect(global.fetch).toHaveBeenCalledWith(
          'https://api.github.com/repos/owner/repo/issues/123/comments',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              Authorization: 'Bearer test-token',
            }),
          })
        );
      });

      it('should skip GitHub when disabled', async () => {
        const notifier = new Notifier({
          github: { enabled: false },
        });

        await notifier.notify({
          deploymentId: 'deploy-1',
          status: 'in_progress',
          message: 'Test',
          prNumber: 123,
        });

        expect(global.fetch).not.toHaveBeenCalled();
      });

      it('should skip GitHub when prNumber is missing', async () => {
        const notifier = new Notifier({
          github: { enabled: true, token: 'token', repo: 'owner/repo' },
        });

        await notifier.notify({
          deploymentId: 'deploy-1',
          status: 'in_progress',
          message: 'Test',
        });

        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    describe('Slack notifications', () => {
      it('should send deployment notification to Slack', async () => {
        const notifier = new Notifier({
          slack: { enabled: true, webhookUrl: 'https://hooks.slack.com/test' },
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
        } as Response);

        await notifier.notify({
          deploymentId: 'deploy-1',
          status: 'completed',
          message: 'Deployment completed',
        });

        expect(global.fetch).toHaveBeenCalledWith(
          'https://hooks.slack.com/test',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('Deployment completed'),
          })
        );
      });

      it('should skip Slack when disabled', async () => {
        const notifier = new Notifier({
          slack: { enabled: false },
        });

        await notifier.notify({
          deploymentId: 'deploy-1',
          status: 'completed',
          message: 'Test',
        });

        expect(global.fetch).not.toHaveBeenCalled();
      });

      it('should handle Slack webhook failure response', async () => {
        const notifier = new Notifier({
          slack: { enabled: true, webhookUrl: 'https://hooks.slack.com/test' },
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as Response);

        // Should not throw
        await expect(
          notifier.notify({
            deploymentId: 'deploy-1',
            status: 'completed',
            message: 'Test',
          })
        ).resolves.not.toThrow();
      });

      it('should send notification with all status types for emoji coverage', async () => {
        const notifier = new Notifier({
          slack: { enabled: true, webhookUrl: 'https://hooks.slack.com/test' },
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
          ok: true,
        } as Response);

        // Test all status types
        await notifier.notify({
          deploymentId: '1',
          status: 'failed',
          message: 'Failed',
        });
        await notifier.notify({
          deploymentId: '2',
          status: 'in_progress',
          message: 'In progress',
        });
        await notifier.notify({
          deploymentId: '3',
          status: 'cancelled',
          message: 'Cancelled',
        });
        await notifier.notify({
          deploymentId: '4',
          status: 'pending',
          message: 'Pending',
        });

        expect(global.fetch).toHaveBeenCalledTimes(4);
      });
    });

    describe('Discord notifications', () => {
      it('should send deployment notification to Discord', async () => {
        const notifier = new Notifier({
          discord: {
            enabled: true,
            webhookUrl: 'https://discord.com/api/webhooks/test',
          },
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
        } as Response);

        await notifier.notify({
          deploymentId: 'deploy-1',
          status: 'failed',
          message: 'Deployment failed',
          error: new Error('Test error'),
        });

        expect(global.fetch).toHaveBeenCalledWith(
          'https://discord.com/api/webhooks/test',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('Deployment failed'),
          })
        );
      });

      it('should skip Discord when disabled', async () => {
        const notifier = new Notifier({
          discord: { enabled: false },
        });

        await notifier.notify({
          deploymentId: 'deploy-1',
          status: 'completed',
          message: 'Test',
        });

        expect(global.fetch).not.toHaveBeenCalled();
      });

      it('should handle Discord webhook failure response', async () => {
        const notifier = new Notifier({
          discord: {
            enabled: true,
            webhookUrl: 'https://discord.com/api/webhooks/test',
          },
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as Response);

        // Should not throw
        await expect(
          notifier.notify({
            deploymentId: 'deploy-1',
            status: 'failed',
            message: 'Test',
          })
        ).resolves.not.toThrow();
      });
    });

    describe('multi-channel notifications', () => {
      it('should send to all enabled channels', async () => {
        const notifier = new Notifier({
          github: { enabled: true, token: 'token', repo: 'owner/repo' },
          slack: { enabled: true, webhookUrl: 'https://hooks.slack.com/test' },
          discord: {
            enabled: true,
            webhookUrl: 'https://discord.com/webhooks/test',
          },
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
          ok: true,
          json: async () => ({}),
        } as Response);

        await notifier.notify({
          deploymentId: 'deploy-1',
          status: 'completed',
          message: 'Deployment completed',
          prNumber: 123,
        });

        expect(global.fetch).toHaveBeenCalledTimes(3);
      });
    });

    describe('error handling', () => {
      it('should handle GitHub API errors gracefully', async () => {
        const notifier = new Notifier({
          github: { enabled: true, token: 'token', repo: 'owner/repo' },
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        } as Response);

        // Should not throw
        await expect(
          notifier.notify({
            deploymentId: 'deploy-1',
            status: 'completed',
            message: 'Test',
            prNumber: 999,
          })
        ).resolves.not.toThrow();
      });

      it('should handle Slack webhook errors gracefully', async () => {
        const notifier = new Notifier({
          slack: {
            enabled: true,
            webhookUrl: 'https://hooks.slack.com/invalid',
          },
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
          new Error('Network error')
        );

        // Should not throw
        await expect(
          notifier.notify({
            deploymentId: 'deploy-1',
            status: 'completed',
            message: 'Test',
          })
        ).resolves.not.toThrow();
      });
    });
  });

  describe('formatDeploymentMessage', () => {
    it('should format deployment start message', () => {
      const message = formatDeploymentMessage({
        deploymentId: 'deploy-1',
        status: 'in_progress',
        message: 'Deployment started',
      });

      expect(message).toContain('Deployment started');
      expect(message).toContain('deploy-1');
      expect(message).toContain('⏳');
    });

    it('should format deployment completion message', () => {
      const message = formatDeploymentMessage({
        deploymentId: 'deploy-1',
        status: 'completed',
        message: 'Deployment completed',
        metadata: { proposalId: '123', duration: '2m 30s' },
      });

      expect(message).toContain('Deployment completed');
      expect(message).toContain('deploy-1');
      expect(message).toContain('✅');
    });

    it('should format deployment failure message with error', () => {
      const message = formatDeploymentMessage({
        deploymentId: 'deploy-1',
        status: 'failed',
        message: 'Deployment failed',
        error: new Error('Validation failed'),
      });

      expect(message).toContain('Deployment failed');
      expect(message).toContain('Validation failed');
      expect(message).toContain('❌');
    });

    it('should format deployment cancelled message', () => {
      const message = formatDeploymentMessage({
        deploymentId: 'deploy-1',
        status: 'cancelled',
        message: 'Deployment cancelled',
      });

      expect(message).toContain('Deployment cancelled');
      expect(message).toContain('🛑');
    });

    it('should format deployment pending message', () => {
      const message = formatDeploymentMessage({
        deploymentId: 'deploy-1',
        status: 'pending',
        message: 'Deployment pending',
      });

      expect(message).toContain('Deployment pending');
      expect(message).toContain('ℹ️');
    });

    it('should include metadata when provided', () => {
      const message = formatDeploymentMessage({
        deploymentId: 'deploy-1',
        status: 'completed',
        message: 'Success',
        metadata: { network: 'sepolia', gasUsed: '100000' },
      });

      expect(message).toContain('sepolia');
      expect(message).toContain('100000');
    });

    it('should include error stack trace when provided', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at Test.test';
      const message = formatDeploymentMessage({
        deploymentId: 'deploy-1',
        status: 'failed',
        message: 'Failed',
        error,
      });

      expect(message).toContain('Stack Trace');
      expect(message).toContain('Test error');
    });
  });

  describe('createNotifier', () => {
    it('should create notifier with configuration', () => {
      const notifier = createNotifier({
        slack: { enabled: true, webhookUrl: 'https://hooks.slack.com/test' },
      });

      expect(notifier).toBeInstanceOf(Notifier);
    });

    it('should create notifier with empty configuration', () => {
      const notifier = createNotifier({});
      expect(notifier).toBeInstanceOf(Notifier);
    });
  });
});
