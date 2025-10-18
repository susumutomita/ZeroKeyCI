import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DeploymentTracker,
  createDeploymentTracker,
  deploymentTracker,
  type DeploymentPhase,
} from '../deployment-tracker';
import { logger } from '../logger';

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('deployment-tracker', () => {
  let tracker: DeploymentTracker;

  beforeEach(() => {
    tracker = new DeploymentTracker();
    vi.clearAllMocks();
  });

  describe('DeploymentTracker', () => {
    describe('start', () => {
      it('should start tracking a deployment', () => {
        tracker.start('deploy-1', { network: 'sepolia' });

        expect(tracker.hasDeployment('deploy-1')).toBe(true);
        expect(tracker.getStatus('deploy-1')).toBe('in_progress');

        const deployment = tracker.getDeployment('deploy-1');
        expect(deployment.id).toBe('deploy-1');
        expect(deployment.status).toBe('in_progress');
        expect(deployment.startTime).toBeInstanceOf(Date);
        expect(deployment.metadata).toEqual({ network: 'sepolia' });
        expect(deployment.events).toEqual([]);

        expect(logger.info).toHaveBeenCalledWith('Deployment started', {
          deploymentId: 'deploy-1',
          network: 'sepolia',
        });
      });

      it('should start deployment without metadata', () => {
        tracker.start('deploy-2');

        const deployment = tracker.getDeployment('deploy-2');
        expect(deployment.metadata).toEqual({});
      });
    });

    describe('startPhase', () => {
      beforeEach(() => {
        tracker.start('deploy-1');
      });

      it('should record phase start event', () => {
        tracker.startPhase('deploy-1', 'validation', 'Starting validation');

        const deployment = tracker.getDeployment('deploy-1');
        expect(deployment.currentPhase).toBe('validation');
        expect(deployment.events).toHaveLength(1);

        const event = deployment.events[0];
        expect(event.phase).toBe('validation');
        expect(event.status).toBe('started');
        expect(event.message).toBe('Starting validation');
        expect(event.timestamp).toBeInstanceOf(Date);

        expect(logger.info).toHaveBeenCalledWith('Starting validation', {
          deploymentId: 'deploy-1',
          phase: 'validation',
        });
      });

      it('should use default message when not provided', () => {
        tracker.startPhase('deploy-1', 'proposal_creation');

        const event = tracker.getDeployment('deploy-1').events[0];
        expect(event.message).toBe('Starting proposal_creation phase');
      });

      it('should include metadata in event', () => {
        tracker.startPhase('deploy-1', 'validation', 'Validating', {
          proposalId: '123',
        });

        const event = tracker.getDeployment('deploy-1').events[0];
        expect(event.metadata).toEqual({ proposalId: '123' });
      });
    });

    describe('completePhase', () => {
      beforeEach(() => {
        tracker.start('deploy-1');
        tracker.startPhase('deploy-1', 'validation');
      });

      it('should record phase completion event', () => {
        tracker.completePhase('deploy-1', 'validation', 'Validation passed');

        const deployment = tracker.getDeployment('deploy-1');
        expect(deployment.events).toHaveLength(2);

        const event = deployment.events[1];
        expect(event.phase).toBe('validation');
        expect(event.status).toBe('completed');
        expect(event.message).toBe('Validation passed');

        expect(logger.info).toHaveBeenCalledWith('Validation passed', {
          deploymentId: 'deploy-1',
          phase: 'validation',
        });
      });

      it('should use default message when not provided', () => {
        tracker.completePhase('deploy-1', 'validation');

        const event = tracker.getDeployment('deploy-1').events[1];
        expect(event.message).toBe('Completed validation phase');
      });
    });

    describe('failPhase', () => {
      beforeEach(() => {
        tracker.start('deploy-1');
        tracker.startPhase('deploy-1', 'validation');
      });

      it('should record phase failure and mark deployment as failed', () => {
        const error = new Error('Validation failed');
        tracker.failPhase('deploy-1', 'validation', error);

        const deployment = tracker.getDeployment('deploy-1');
        expect(deployment.status).toBe('failed');
        expect(deployment.endTime).toBeInstanceOf(Date);
        expect(deployment.events).toHaveLength(2);

        const event = deployment.events[1];
        expect(event.phase).toBe('validation');
        expect(event.status).toBe('failed');
        expect(event.message).toContain('Validation failed');
        expect(event.error).toBe(error);

        expect(logger.error).toHaveBeenCalled();
      });

      it('should use custom message', () => {
        const error = new Error('Error');
        tracker.failPhase(
          'deploy-1',
          'validation',
          error,
          'Custom error message'
        );

        const event = tracker.getDeployment('deploy-1').events[1];
        expect(event.message).toBe('Custom error message');
      });
    });

    describe('complete', () => {
      beforeEach(() => {
        tracker.start('deploy-1');
      });

      it('should mark deployment as completed', () => {
        tracker.complete('deploy-1', { proposalId: '123' });

        const deployment = tracker.getDeployment('deploy-1');
        expect(deployment.status).toBe('completed');
        expect(deployment.endTime).toBeInstanceOf(Date);
        expect(deployment.metadata.proposalId).toBe('123');

        expect(logger.info).toHaveBeenCalledWith(
          'Deployment completed',
          expect.objectContaining({
            deploymentId: 'deploy-1',
            proposalId: '123',
          })
        );
      });

      it('should complete without additional metadata', () => {
        tracker.complete('deploy-1');

        const deployment = tracker.getDeployment('deploy-1');
        expect(deployment.status).toBe('completed');
      });
    });

    describe('fail', () => {
      beforeEach(() => {
        tracker.start('deploy-1');
      });

      it('should mark deployment as failed', () => {
        const error = new Error('Deployment error');
        tracker.fail('deploy-1', error, { step: 'submission' });

        const deployment = tracker.getDeployment('deploy-1');
        expect(deployment.status).toBe('failed');
        expect(deployment.endTime).toBeInstanceOf(Date);
        expect(deployment.metadata.step).toBe('submission');

        expect(logger.error).toHaveBeenCalledWith(
          'Deployment failed',
          error,
          expect.objectContaining({
            deploymentId: 'deploy-1',
            step: 'submission',
          })
        );
      });
    });

    describe('cancel', () => {
      beforeEach(() => {
        tracker.start('deploy-1');
      });

      it('should mark deployment as cancelled', () => {
        tracker.cancel('deploy-1', 'User cancelled');

        const deployment = tracker.getDeployment('deploy-1');
        expect(deployment.status).toBe('cancelled');
        expect(deployment.endTime).toBeInstanceOf(Date);

        expect(logger.warn).toHaveBeenCalledWith(
          'Deployment cancelled',
          expect.objectContaining({
            deploymentId: 'deploy-1',
            reason: 'User cancelled',
          })
        );
      });

      it('should cancel without reason', () => {
        tracker.cancel('deploy-1');

        expect(tracker.getStatus('deploy-1')).toBe('cancelled');
      });
    });

    describe('getDeployment', () => {
      it('should throw error for non-existent deployment', () => {
        expect(() => tracker.getDeployment('non-existent')).toThrow(
          'Deployment not found: non-existent'
        );
      });
    });

    describe('hasDeployment', () => {
      it('should return true for existing deployment', () => {
        tracker.start('deploy-1');
        expect(tracker.hasDeployment('deploy-1')).toBe(true);
      });

      it('should return false for non-existent deployment', () => {
        expect(tracker.hasDeployment('non-existent')).toBe(false);
      });
    });

    describe('getDuration', () => {
      it('should calculate duration for completed deployment', () => {
        tracker.start('deploy-1');

        // Simulate some time passing
        const deployment = tracker.getDeployment('deploy-1');
        deployment.endTime = new Date(deployment.startTime.getTime() + 5000);

        const duration = tracker.getDuration('deploy-1');
        expect(duration).toBe(5000);
      });

      it('should calculate duration for in-progress deployment', () => {
        tracker.start('deploy-1');

        const duration = tracker.getDuration('deploy-1');
        expect(duration).toBeGreaterThanOrEqual(0);
      });
    });

    describe('getFormattedDuration', () => {
      it('should format duration in seconds', () => {
        tracker.start('deploy-1');
        const deployment = tracker.getDeployment('deploy-1');
        deployment.endTime = new Date(deployment.startTime.getTime() + 30000);

        const formatted = tracker.getFormattedDuration('deploy-1');
        expect(formatted).toBe('30s');
      });

      it('should format duration in minutes and seconds', () => {
        tracker.start('deploy-1');
        const deployment = tracker.getDeployment('deploy-1');
        deployment.endTime = new Date(deployment.startTime.getTime() + 125000);

        const formatted = tracker.getFormattedDuration('deploy-1');
        expect(formatted).toBe('2m 5s');
      });
    });

    describe('getProgress', () => {
      it('should return deployment progress report', () => {
        tracker.start('deploy-1');
        tracker.startPhase('deploy-1', 'validation');
        tracker.completePhase('deploy-1', 'validation');
        tracker.startPhase('deploy-1', 'proposal_creation');
        tracker.completePhase('deploy-1', 'proposal_creation');

        const progress = tracker.getProgress('deploy-1');

        expect(progress.deploymentId).toBe('deploy-1');
        expect(progress.status).toBe('in_progress');
        expect(progress.currentPhase).toBe('proposal_creation');
        expect(progress.completedPhases).toEqual([
          'validation',
          'proposal_creation',
        ]);
        expect(progress.failedPhases).toEqual([]);
        expect(progress.events).toHaveLength(4);
        expect(progress.duration).toBeDefined();
      });

      it('should track failed phases', () => {
        tracker.start('deploy-1');
        tracker.startPhase('deploy-1', 'validation');
        tracker.failPhase('deploy-1', 'validation', new Error('Failed'));

        const progress = tracker.getProgress('deploy-1');

        expect(progress.failedPhases).toEqual(['validation']);
        expect(progress.completedPhases).toEqual([]);
      });
    });

    describe('getSummary', () => {
      it('should return summary of all deployments', () => {
        tracker.start('deploy-1');
        tracker.start('deploy-2');
        tracker.complete('deploy-2');
        tracker.start('deploy-3');
        tracker.fail('deploy-3', new Error('Failed'));

        const summary = tracker.getSummary();

        expect(summary.total).toBe(3);
        expect(summary.in_progress).toBe(1);
        expect(summary.completed).toBe(1);
        expect(summary.failed).toBe(1);
      });

      it('should return empty summary for no deployments', () => {
        const summary = tracker.getSummary();

        expect(summary.total).toBe(0);
        expect(summary.in_progress).toBe(0);
        expect(summary.completed).toBe(0);
        expect(summary.failed).toBe(0);
      });
    });

    describe('clear', () => {
      it('should clear specific deployment', () => {
        tracker.start('deploy-1');
        tracker.start('deploy-2');

        const cleared = tracker.clear('deploy-1');

        expect(cleared).toBe(true);
        expect(tracker.hasDeployment('deploy-1')).toBe(false);
        expect(tracker.hasDeployment('deploy-2')).toBe(true);
      });

      it('should return false for non-existent deployment', () => {
        const cleared = tracker.clear('non-existent');
        expect(cleared).toBe(false);
      });
    });

    describe('clearAll', () => {
      it('should clear all deployments', () => {
        tracker.start('deploy-1');
        tracker.start('deploy-2');
        tracker.start('deploy-3');

        tracker.clearAll();

        expect(tracker.getSummary().total).toBe(0);
      });
    });
  });

  describe('createDeploymentTracker', () => {
    it('should create new tracker instance', () => {
      const newTracker = createDeploymentTracker();
      expect(newTracker).toBeInstanceOf(DeploymentTracker);
    });

    it('should create independent instances', () => {
      const tracker1 = createDeploymentTracker();
      const tracker2 = createDeploymentTracker();

      tracker1.start('deploy-1');
      expect(tracker1.hasDeployment('deploy-1')).toBe(true);
      expect(tracker2.hasDeployment('deploy-1')).toBe(false);
    });
  });

  describe('default deploymentTracker instance', () => {
    it('should be a DeploymentTracker instance', () => {
      expect(deploymentTracker).toBeInstanceOf(DeploymentTracker);
    });
  });
});
