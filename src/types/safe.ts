/**
 * Safe transaction data structure
 */
export interface SafeTransactionData {
  /** Target address for the transaction */
  to: string;
  /** Value to send in wei (as string) */
  value: string;
  /** Encoded transaction data */
  data: string;
  /** Operation type: 0 = Call, 1 = DelegateCall */
  operation: number;
  /** Optional: Safe transaction gas limit */
  safeTxGas?: string;
  /** Optional: Base gas for the transaction */
  baseGas?: string;
  /** Optional: Gas price in wei */
  gasPrice?: string;
  /** Optional: Gas token address (0x0 for ETH) */
  gasToken?: string;
  /** Optional: Refund receiver address */
  refundReceiver?: string;
  /** Optional: Nonce for the transaction */
  nonce?: number;
}

/**
 * Deployment data for creating new contracts
 */
export interface DeploymentData {
  /** Name of the contract being deployed */
  contractName: string;
  /** Contract bytecode (including constructor) */
  bytecode: string;
  /** Constructor arguments */
  constructorArgs: any[];
  /** Value to send with deployment in wei */
  value: string;
  /** Optional metadata for tracking */
  metadata?: DeploymentMetadata;
}

/**
 * Upgrade data for UUPS proxy contracts
 */
export interface UpgradeData {
  /** Address of the proxy contract */
  proxyAddress: string;
  /** Address of the new implementation */
  newImplementation: string;
  /** Function selector for upgrade (e.g., 'upgradeTo(address)') */
  functionSelector: string;
  /** Optional arguments for upgrade function */
  upgradeArgs?: any[];
}

/**
 * Metadata for deployment tracking
 */
export interface DeploymentMetadata {
  /** Pull request reference */
  pr?: string;
  /** Git commit hash */
  commit?: string;
  /** Deployer identifier */
  deployer?: string;
  /** Timestamp of proposal creation */
  timestamp?: number;
  /** Contract name for reference */
  contractName?: string;
}

/**
 * Batch proposal containing multiple transactions
 */
export interface BatchProposal {
  /** Array of transactions to execute */
  transactions: SafeTransactionData[];
  /** Combined metadata for the batch */
  metadata?: DeploymentMetadata;
}

/**
 * Serialized proposal for storage/transmission
 */
export interface SerializedProposal {
  /** The transaction proposal */
  proposal: SafeTransactionData | BatchProposal;
  /** Associated metadata */
  metadata: DeploymentMetadata;
  /** Safe address */
  safeAddress: string;
  /** Chain ID */
  chainId: number;
  /** Validation hash for integrity check */
  validationHash: string;
  /** Timestamp of serialization */
  timestamp: number;
}

/**
 * Configuration for SafeProposalBuilder
 */
export interface SafeProposalConfig {
  /** Address of the Safe multisig */
  safeAddress: string;
  /** Chain ID for the network */
  chainId: number;
  /** Optional: Default gas settings */
  defaultGasSettings?: {
    safeTxGas?: string;
    baseGas?: string;
    gasPrice?: string;
    gasToken?: string;
  };
}
