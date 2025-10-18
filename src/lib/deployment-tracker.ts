/**
 * Deployment status tracking and progress monitoring
 *
 * Features:
 * - Track deployment lifecycle phases
 * - Record deployment events with timestamps
 * - Generate progress reports
 * - Support for concurrent deployments
 */

import { logger } from './logger';

/**
 * Deployment status
 */
export type DeploymentStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Deployment phase - steps in the deployment process
 */
export type DeploymentPhase =
  | 'validation'
  | 'proposal_creation'
  | 'policy_validation'
  | 'submission'
  | 'confirmation';

/**
 * Deployment event
 */
export interface DeploymentEvent {
  timestamp: Date;
  phase: DeploymentPhase;
  status: 'started' | 'completed' | 'failed';
  message: string;
  metadata?: Record<string, unknown>;
  error?: Error;
}

/**
 * Deployment tracking data
 */
export interface DeploymentTracking {
  id: string;
  status: DeploymentStatus;
  startTime: Date;
  endTime?: Date;
  currentPhase?: DeploymentPhase;
  events: DeploymentEvent[];
  metadata: Record<string, unknown>;
}

/**
 * Deployment tracker for monitoring deployment progress
 */
export class DeploymentTracker {
  private deployments: Map<string, DeploymentTracking>;
  private logger: typeof logger;

  constructor(customLogger = logger) {
    this.deployments = new Map();
    this.logger = customLogger;
  }

  /**
   * Start tracking a new deployment
   */
  start(id: string, metadata: Record<string, unknown> = {}): void {
    const deployment: DeploymentTracking = {
      id,
      status: 'in_progress',
      startTime: new Date(),
      events: [],
      metadata,
    };

    this.deployments.set(id, deployment);

    this.logger.info('Deployment started', {
      deploymentId: id,
      ...metadata,
    });
  }

  /**
   * Record a phase start event
   */
  startPhase(
    id: string,
    phase: DeploymentPhase,
    message?: string,
    metadata?: Record<string, unknown>
  ): void {
    const deployment = this.getDeployment(id);

    const event: DeploymentEvent = {
      timestamp: new Date(),
      phase,
      status: 'started',
      message: message || `Starting ${phase} phase`,
      metadata,
    };

    deployment.events.push(event);
    deployment.currentPhase = phase;

    this.logger.info(event.message, {
      deploymentId: id,
      phase,
      ...metadata,
    });
  }

  /**
   * Record a phase completion event
   */
  completePhase(
    id: string,
    phase: DeploymentPhase,
    message?: string,
    metadata?: Record<string, unknown>
  ): void {
    const deployment = this.getDeployment(id);

    const event: DeploymentEvent = {
      timestamp: new Date(),
      phase,
      status: 'completed',
      message: message || `Completed ${phase} phase`,
      metadata,
    };

    deployment.events.push(event);

    this.logger.info(event.message, {
      deploymentId: id,
      phase,
      ...metadata,
    });
  }

  /**
   * Record a phase failure event
   */
  failPhase(
    id: string,
    phase: DeploymentPhase,
    error: Error,
    message?: string,
    metadata?: Record<string, unknown>
  ): void {
    const deployment = this.getDeployment(id);

    const event: DeploymentEvent = {
      timestamp: new Date(),
      phase,
      status: 'failed',
      message: message || `Failed ${phase} phase: ${error.message}`,
      metadata,
      error,
    };

    deployment.events.push(event);
    deployment.status = 'failed';
    deployment.endTime = new Date();

    this.logger.error(event.message, error, {
      deploymentId: id,
      phase,
      ...metadata,
    });
  }

  /**
   * Complete a deployment
   */
  complete(id: string, metadata?: Record<string, unknown>): void {
    const deployment = this.getDeployment(id);

    deployment.status = 'completed';
    deployment.endTime = new Date();

    if (metadata) {
      deployment.metadata = { ...deployment.metadata, ...metadata };
    }

    this.logger.info('Deployment completed', {
      deploymentId: id,
      duration: this.getDuration(id),
      ...metadata,
    });
  }

  /**
   * Fail a deployment
   */
  fail(id: string, error: Error, metadata?: Record<string, unknown>): void {
    const deployment = this.getDeployment(id);

    deployment.status = 'failed';
    deployment.endTime = new Date();

    if (metadata) {
      deployment.metadata = { ...deployment.metadata, ...metadata };
    }

    this.logger.error('Deployment failed', error, {
      deploymentId: id,
      duration: this.getDuration(id),
      ...metadata,
    });
  }

  /**
   * Cancel a deployment
   */
  cancel(id: string, reason?: string): void {
    const deployment = this.getDeployment(id);

    deployment.status = 'cancelled';
    deployment.endTime = new Date();

    this.logger.warn('Deployment cancelled', {
      deploymentId: id,
      reason,
      duration: this.getDuration(id),
    });
  }

  /**
   * Get deployment tracking data
   */
  getDeployment(id: string): DeploymentTracking {
    const deployment = this.deployments.get(id);
    if (!deployment) {
      throw new Error(`Deployment not found: ${id}`);
    }
    return deployment;
  }

  /**
   * Check if deployment exists
   */
  hasDeployment(id: string): boolean {
    return this.deployments.has(id);
  }

  /**
   * Get deployment status
   */
  getStatus(id: string): DeploymentStatus {
    return this.getDeployment(id).status;
  }

  /**
   * Get deployment duration in milliseconds
   */
  getDuration(id: string): number {
    const deployment = this.getDeployment(id);
    const endTime = deployment.endTime || new Date();
    return endTime.getTime() - deployment.startTime.getTime();
  }

  /**
   * Get deployment duration formatted
   */
  getFormattedDuration(id: string): string {
    const duration = this.getDuration(id);
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Get deployment progress report
   */
  getProgress(id: string): {
    deploymentId: string;
    status: DeploymentStatus;
    currentPhase?: DeploymentPhase;
    duration: string;
    completedPhases: DeploymentPhase[];
    failedPhases: DeploymentPhase[];
    events: DeploymentEvent[];
  } {
    const deployment = this.getDeployment(id);

    const completedPhases = deployment.events
      .filter((e) => e.status === 'completed')
      .map((e) => e.phase);

    const failedPhases = deployment.events
      .filter((e) => e.status === 'failed')
      .map((e) => e.phase);

    return {
      deploymentId: deployment.id,
      status: deployment.status,
      currentPhase: deployment.currentPhase,
      duration: this.getFormattedDuration(id),
      completedPhases,
      failedPhases,
      events: deployment.events,
    };
  }

  /**
   * Get summary of all deployments
   */
  getSummary(): {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    failed: number;
    cancelled: number;
  } {
    const summary = {
      total: this.deployments.size,
      pending: 0,
      in_progress: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    for (const deployment of this.deployments.values()) {
      summary[deployment.status]++;
    }

    return summary;
  }

  /**
   * Clear deployment tracking data
   */
  clear(id: string): boolean {
    return this.deployments.delete(id);
  }

  /**
   * Clear all deployment tracking data
   */
  clearAll(): void {
    this.deployments.clear();
  }
}

/**
 * Default deployment tracker instance
 */
export const deploymentTracker = new DeploymentTracker();

/**
 * Create a new deployment tracker instance
 */
export function createDeploymentTracker(): DeploymentTracker {
  return new DeploymentTracker();
}
