/**
 * API Types for ZeroKeyCI
 */

import { SafeTransactionData } from './safe';

/**
 * Request to create a new Safe proposal
 */
export interface CreateProposalRequest {
  contractName: string;
  bytecode: string;
  constructorArgs?: any[];
  value?: string;
  network: string;
  metadata?: {
    description?: string;
    requestor?: string;
    jiraTicket?: string;
    auditReport?: string;
    txHash?: string;
    error?: string;
    [key: string]: any;
  };
}

/**
 * Response from creating a Safe proposal
 */
export interface CreateProposalResponse {
  success: boolean;
  proposalId?: string;
  proposal?: SafeTransactionData;
  safeAddress?: string;
  validationHash?: string;
  error?: string;
}

/**
 * Safe proposal with metadata
 */
export interface ProposalWithMetadata {
  id: string;
  proposal: SafeTransactionData;
  safeAddress: string;
  chainId: number;
  network: string;
  contractName: string;
  validationHash: string;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    description?: string;
    requestor?: string;
    jiraTicket?: string;
    auditReport?: string;
    txHash?: string;
    error?: string;
    [key: string]: any;
  };
}

/**
 * Proposal status
 */
export enum ProposalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  EXECUTED = 'executed',
  REJECTED = 'rejected',
  FAILED = 'failed',
}

/**
 * Request to get proposals
 */
export interface GetProposalsRequest {
  network?: string;
  status?: ProposalStatus;
  limit?: number;
  offset?: number;
}

/**
 * Response from getting proposals
 */
export interface GetProposalsResponse {
  success: boolean;
  proposals: ProposalWithMetadata[];
  total: number;
  error?: string;
}

/**
 * Request to update proposal status
 */
export interface UpdateProposalStatusRequest {
  proposalId: string;
  status: ProposalStatus;
  txHash?: string;
  error?: string;
}

/**
 * Response from updating proposal status
 */
export interface UpdateProposalStatusResponse {
  success: boolean;
  proposal?: ProposalWithMetadata;
  error?: string;
}
