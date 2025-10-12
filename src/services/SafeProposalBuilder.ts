import { utils, BigNumber, constants } from 'ethers';
import type {
  SafeTransactionData,
  DeploymentData,
  UpgradeData,
  DeploymentMetadata,
  SafeProposalConfig,
  BatchProposal,
  SerializedProposal,
} from '../types/safe';

/**
 * SafeProposalBuilder - Creates Safe transaction proposals without private keys
 *
 * This class enables CI/CD pipelines to create deployment and upgrade proposals
 * for Gnosis Safe multisig wallets without requiring any private keys.
 * All proposals are created deterministically and can be validated before execution.
 */
export class SafeProposalBuilder {
  private safeAddress: string;
  private chainId: number;
  private metadata: DeploymentMetadata = {};
  private defaultGasSettings: SafeProposalConfig['defaultGasSettings'];

  constructor(config: SafeProposalConfig) {
    // Validate safe address
    if (!utils.isAddress(config.safeAddress)) {
      throw new Error('Invalid safe address');
    }

    // Validate chain ID
    if (!config.chainId || config.chainId <= 0) {
      throw new Error('Invalid chain ID');
    }

    this.safeAddress = config.safeAddress;
    this.chainId = config.chainId;
    this.defaultGasSettings = config.defaultGasSettings;
  }

  /**
   * Get the configured Safe address
   */
  getSafeAddress(): string {
    return this.safeAddress;
  }

  /**
   * Get the configured chain ID
   */
  getChainId(): number {
    return this.chainId;
  }

  /**
   * Get current metadata
   */
  getMetadata(): DeploymentMetadata {
    return { ...this.metadata };
  }

  /**
   * Create a deployment proposal for a new contract
   * @param deploymentData Contract deployment information
   * @returns Safe transaction data for deployment
   */
  async createDeploymentProposal(
    deploymentData: DeploymentData
  ): Promise<SafeTransactionData> {
    // Encode constructor arguments if any
    let deployBytecode = deploymentData.bytecode;

    if (
      deploymentData.constructorArgs &&
      deploymentData.constructorArgs.length > 0
    ) {
      // For simplicity, we'll use the ABI coder to encode constructor args
      // In production, this would be more sophisticated
      const abiCoder = new utils.AbiCoder();
      // Infer types based on constructor args
      const types = deploymentData.constructorArgs.map((arg) => {
        if (typeof arg === 'string' && !utils.isAddress(arg)) {
          // If it's a string but not an address, treat as string
          return 'string';
        } else if (typeof arg === 'string' && utils.isAddress(arg)) {
          // If it's an address, use address type
          return 'address';
        } else if (typeof arg === 'number' || typeof arg === 'bigint') {
          // If it's a number, use uint256
          return 'uint256';
        } else if (typeof arg === 'boolean') {
          return 'bool';
        } else {
          // Default to bytes32 for other types
          return 'bytes32';
        }
      });
      const encodedArgs = abiCoder.encode(
        types,
        deploymentData.constructorArgs
      );
      deployBytecode = deploymentData.bytecode + encodedArgs.slice(2);
    }

    // Store metadata
    this.metadata = {
      ...deploymentData.metadata,
      timestamp: Date.now(),
      contractName: deploymentData.contractName,
    };

    // Create deployment transaction
    // For CREATE operations, 'to' is the zero address
    const proposal: SafeTransactionData = {
      to: constants.AddressZero,
      value: deploymentData.value || '0',
      data: deployBytecode,
      operation: 0, // Call operation for CREATE
      ...this.defaultGasSettings,
    };

    return proposal;
  }

  /**
   * Create an upgrade proposal for a UUPS proxy contract
   * @param upgradeData Upgrade information
   * @returns Safe transaction data for upgrade
   */
  async createUpgradeProposal(
    upgradeData: UpgradeData
  ): Promise<SafeTransactionData> {
    // Validate proxy address
    if (!utils.isAddress(upgradeData.proxyAddress)) {
      throw new Error('Invalid proxy address');
    }

    // Validate implementation address
    if (!utils.isAddress(upgradeData.newImplementation)) {
      throw new Error('Invalid implementation address');
    }

    // Encode the upgrade function call
    const iface = new utils.Interface([
      `function ${upgradeData.functionSelector}`,
    ]);

    const encodedData = iface.encodeFunctionData(
      upgradeData.functionSelector.split('(')[0],
      [upgradeData.newImplementation, ...(upgradeData.upgradeArgs || [])]
    );

    const proposal: SafeTransactionData = {
      to: upgradeData.proxyAddress,
      value: '0',
      data: encodedData,
      operation: 0, // Call operation
      ...this.defaultGasSettings,
    };

    return proposal;
  }

  /**
   * Serialize a proposal to JSON for storage/transmission
   * @param proposal The proposal to serialize
   * @returns JSON string of serialized proposal
   */
  serializeProposal(proposal: SafeTransactionData | BatchProposal): string {
    // Calculate validation hash
    const proposalData = JSON.stringify(proposal);
    const validationHash = utils.keccak256(utils.toUtf8Bytes(proposalData));

    const serialized: SerializedProposal = {
      proposal,
      metadata: this.metadata,
      safeAddress: this.safeAddress,
      chainId: this.chainId,
      validationHash,
      timestamp: Date.now(),
    };

    return JSON.stringify(serialized, null, 2);
  }

  /**
   * Validate a proposal structure
   * @param proposal The proposal to validate
   * @returns True if valid, false otherwise
   */
  validateProposal(proposal: SafeTransactionData): boolean {
    try {
      // Validate 'to' address (can be zero for CREATE)
      if (
        proposal.to !== constants.AddressZero &&
        !utils.isAddress(proposal.to)
      ) {
        return false;
      }

      // Validate value is non-negative
      const value = BigNumber.from(proposal.value);
      if (value.lt(0)) {
        return false;
      }

      // Validate operation is 0 (Call) or 1 (DelegateCall)
      if (proposal.operation !== 0 && proposal.operation !== 1) {
        return false;
      }

      // Validate data starts with 0x
      if (!proposal.data.startsWith('0x')) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create a batch proposal containing multiple transactions
   * @param transactions Array of transactions to batch
   * @returns Batch proposal
   */
  createBatchProposal(transactions: SafeTransactionData[]): BatchProposal {
    return {
      transactions,
      metadata: this.metadata,
    };
  }

  /**
   * Calculate deterministic deployment address using CREATE2
   * @param bytecode Contract bytecode
   * @param salt Salt for CREATE2
   * @returns Deterministic contract address
   */
  calculateDeploymentAddress(bytecode: string, salt: string): string {
    // CREATE2 address calculation
    // address = keccak256(0xff ++ deployer ++ salt ++ keccak256(bytecode))[12:]

    const bytecodeHash = utils.keccak256(bytecode);

    const payload = utils.concat([
      '0xff',
      this.safeAddress, // Deployer is the Safe
      salt,
      bytecodeHash,
    ]);

    const address = utils.keccak256(payload);
    // Take last 20 bytes
    return utils.getAddress('0x' + address.slice(-40));
  }
}
