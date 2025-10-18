/**
 * Notification system for deployment events
 *
 * Features:
 * - GitHub PR comments
 * - Slack webhook integration
 * - Discord webhook integration
 * - Deployment message formatting
 */

import { logger } from './logger';
import type { DeploymentStatus } from './deployment-tracker';

/**
 * Notification channel configuration
 */
export interface NotificationChannel {
  enabled: boolean;
  token?: string;
  repo?: string;
  webhookUrl?: string;
}

/**
 * Notifier configuration
 */
export interface NotifierConfig {
  github?: NotificationChannel;
  slack?: NotificationChannel;
  discord?: NotificationChannel;
}

/**
 * Deployment notification
 */
export interface DeploymentNotification {
  deploymentId: string;
  status: DeploymentStatus;
  message: string;
  prNumber?: number;
  error?: Error;
  metadata?: Record<string, unknown>;
}

/**
 * Notifier for sending deployment notifications
 */
export class Notifier {
  private config: NotifierConfig;

  constructor(config: NotifierConfig) {
    this.config = config;
  }

  /**
   * Send notification to all enabled channels
   */
  async notify(notification: DeploymentNotification): Promise<void> {
    const promises: Promise<void>[] = [];

    // GitHub PR comments
    if (this.config.github?.enabled && notification.prNumber) {
      promises.push(this.notifyGitHub(notification));
    }

    // Slack webhook
    if (this.config.slack?.enabled) {
      promises.push(this.notifySlack(notification));
    }

    // Discord webhook
    if (this.config.discord?.enabled) {
      promises.push(this.notifyDiscord(notification));
    }

    // Send all notifications in parallel
    await Promise.allSettled(promises);
  }

  /**
   * Send notification to GitHub PR
   */
  private async notifyGitHub(
    notification: DeploymentNotification
  ): Promise<void> {
    try {
      const { token, repo } = this.config.github!;
      const { prNumber } = notification;

      const message = formatDeploymentMessage(notification);

      const response = await fetch(
        `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json',
          },
          body: JSON.stringify({ body: message }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText}`
        );
      }

      logger.debug('GitHub notification sent', {
        deploymentId: notification.deploymentId,
        prNumber,
      });
    } catch (error) {
      logger.error('Failed to send GitHub notification', error as Error, {
        deploymentId: notification.deploymentId,
      });
    }
  }

  /**
   * Send notification to Slack
   */
  private async notifySlack(
    notification: DeploymentNotification
  ): Promise<void> {
    try {
      const { webhookUrl } = this.config.slack!;
      const message = formatDeploymentMessage(notification);

      const response = await fetch(webhookUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message,
          username: 'ZeroKeyCI',
          icon_emoji: this.getStatusEmoji(notification.status),
        }),
      });

      if (!response.ok) {
        throw new Error(`Slack webhook error: ${response.status}`);
      }

      logger.debug('Slack notification sent', {
        deploymentId: notification.deploymentId,
      });
    } catch (error) {
      logger.error('Failed to send Slack notification', error as Error, {
        deploymentId: notification.deploymentId,
      });
    }
  }

  /**
   * Send notification to Discord
   */
  private async notifyDiscord(
    notification: DeploymentNotification
  ): Promise<void> {
    try {
      const { webhookUrl } = this.config.discord!;
      const message = formatDeploymentMessage(notification);

      const response = await fetch(webhookUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message,
          username: 'ZeroKeyCI',
        }),
      });

      if (!response.ok) {
        throw new Error(`Discord webhook error: ${response.status}`);
      }

      logger.debug('Discord notification sent', {
        deploymentId: notification.deploymentId,
      });
    } catch (error) {
      logger.error('Failed to send Discord notification', error as Error, {
        deploymentId: notification.deploymentId,
      });
    }
  }

  /**
   * Get emoji for deployment status
   */
  private getStatusEmoji(status: DeploymentStatus): string {
    switch (status) {
      case 'completed':
        return ':white_check_mark:';
      case 'failed':
        return ':x:';
      case 'in_progress':
        return ':hourglass:';
      case 'cancelled':
        return ':stop_sign:';
      default:
        return ':information_source:';
    }
  }
}

/**
 * Format deployment notification message
 */
export function formatDeploymentMessage(
  notification: DeploymentNotification
): string {
  const { deploymentId, status, message, error, metadata } = notification;

  let formattedMessage = `## ${getStatusIcon(status)} ${message}\n\n`;
  formattedMessage += `**Deployment ID**: \`${deploymentId}\`\n`;
  formattedMessage += `**Status**: ${status}\n`;

  if (metadata && Object.keys(metadata).length > 0) {
    formattedMessage += '\n**Details**:\n';
    for (const [key, value] of Object.entries(metadata)) {
      formattedMessage += `- **${key}**: ${value}\n`;
    }
  }

  if (error) {
    formattedMessage += `\n**Error**: ${error.message}\n`;
    if (error.stack) {
      formattedMessage += `\n<details>\n<summary>Stack Trace</summary>\n\n\`\`\`\n${error.stack}\n\`\`\`\n</details>\n`;
    }
  }

  return formattedMessage;
}

/**
 * Get status icon for message formatting
 */
function getStatusIcon(status: DeploymentStatus): string {
  switch (status) {
    case 'completed':
      return '✅';
    case 'failed':
      return '❌';
    case 'in_progress':
      return '⏳';
    case 'cancelled':
      return '🛑';
    default:
      return 'ℹ️';
  }
}

/**
 * Create a new notifier instance
 */
export function createNotifier(config: NotifierConfig): Notifier {
  return new Notifier(config);
}
