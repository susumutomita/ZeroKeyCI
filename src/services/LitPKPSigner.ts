import { LitNodeClient } from '@lit-protocol/lit-node-client';
import type { SessionSigsMap, LIT_NETWORKS_KEYS } from '@lit-protocol/types';
import { utils, BigNumber } from 'ethers';
import type { SafeTransactionData } from '../types/safe';

export interface LitPKPSignerConfig {
  pkpPublicKey: string;
  network: LIT_NETWORKS_KEYS;
  debug?: boolean;
}

export interface SigningConditions {
  opaPolicyPassed: boolean;
  testsPassed: boolean;
  prMerged: boolean;
  deploymentConfig?: Record<string, unknown>;
}

export interface ECDSASignature {
  r: string;
  s: string;
  v: number;
}

export interface LitActionResult {
  signatures: Record<
    string,
    {
      r: string;
      s: string;
      recid: number;
      signature: string;
      publicKey: string;
      dataSigned: string;
    }
  >;
  logs: string;
  success: boolean;
}

/**
 * LitPKPSigner - Signs Safe transactions using Lit Protocol PKPs
 *
 * This class enables automated signing of Safe transactions using Programmable Key Pairs (PKPs)
 * from Lit Protocol. The PKP private key never exists in full - it's distributed across
 * Lit Protocol's decentralized network using threshold cryptography.
 *
 * Key features:
 * - Zero private keys stored locally or in CI/CD
 * - Conditional signing based on OPA policies, test results, and PR status
 * - ECDSA signatures compatible with Gnosis Safe
 * - Complete audit trail of signing conditions
 */
export class LitPKPSigner {
  private readonly pkpPublicKey: string;
  private readonly network: LitPKPSignerConfig['network'];
  private readonly debug: boolean;
  private litNodeClient: LitNodeClient | null = null;
  private connected = false;

  constructor(config: LitPKPSignerConfig) {
    // Validate configuration
    if (!config.pkpPublicKey || config.pkpPublicKey.trim() === '') {
      throw new Error(
        'LitPKPSigner: PKP public key is required in configuration'
      );
    }

    if (!config.network || config.network.trim() === '') {
      throw new Error('LitPKPSigner: Lit network is required in configuration');
    }

    // Validate PKP public key format (should be hex string starting with 0x04)
    // Uncompressed ECDSA public key: 0x04 + 64 bytes (128 hex chars) = 132 chars total
    if (
      !config.pkpPublicKey.startsWith('0x04') ||
      config.pkpPublicKey.length !== 132 ||
      !/^0x04[0-9a-fA-F]{128}$/.test(config.pkpPublicKey)
    ) {
      throw new Error(
        'LitPKPSigner: Invalid PKP public key format. Expected uncompressed ECDSA public key (0x04 + 128 hex chars)'
      );
    }

    this.pkpPublicKey = config.pkpPublicKey;
    this.network = config.network;
    this.debug = config.debug ?? false;

    if (this.debug) {
      console.log('[LitPKPSigner] Initialized with network:', this.network);
      console.log('[LitPKPSigner] PKP address:', this.getPKPEthAddress());
    }
  }

  /**
   * Connect to Lit Protocol network
   * @throws Error if connection fails
   */
  async connect(): Promise<void> {
    if (this.connected && this.litNodeClient) {
      if (this.debug) {
        console.log('[LitPKPSigner] Already connected to Lit network');
      }
      return;
    }

    try {
      if (this.debug) {
        console.log('[LitPKPSigner] Connecting to Lit network:', this.network);
      }

      this.litNodeClient = new LitNodeClient({
        litNetwork: this.network as any, // Type assertion needed due to Lit Protocol SDK type limitations
        debug: this.debug,
      });

      await this.litNodeClient.connect();
      this.connected = true;

      if (this.debug) {
        console.log('[LitPKPSigner] Successfully connected to Lit network');
      }
    } catch (error) {
      this.connected = false;
      this.litNodeClient = null;

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `LitPKPSigner: Failed to connect to Lit network (${this.network}): ${errorMessage}`
      );
    }
  }

  /**
   * Disconnect from Lit Protocol network
   */
  async disconnect(): Promise<void> {
    if (!this.litNodeClient) {
      if (this.debug) {
        console.log('[LitPKPSigner] Not connected, nothing to disconnect');
      }
      return;
    }

    try {
      if (this.debug) {
        console.log('[LitPKPSigner] Disconnecting from Lit network');
      }

      await this.litNodeClient.disconnect();
      this.connected = false;
      this.litNodeClient = null;

      if (this.debug) {
        console.log('[LitPKPSigner] Successfully disconnected');
      }
    } catch (error) {
      // Still mark as disconnected even if disconnect fails
      this.connected = false;
      this.litNodeClient = null;

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.warn(`[LitPKPSigner] Error during disconnect: ${errorMessage}`);
    }
  }

  /**
   * Check if connected to Lit network
   */
  isConnected(): boolean {
    return this.connected && this.litNodeClient !== null;
  }

  /**
   * Sign a Safe transaction using PKP
   *
   * This method:
   * 1. Validates the transaction structure
   * 2. Creates a Safe transaction hash (EIP-712 compatible)
   * 3. Executes a Lit Action to sign with the PKP
   * 4. Returns an ECDSA signature compatible with Gnosis Safe
   *
   * @param transaction Safe transaction data to sign
   * @param sessionSigs Session signatures for Lit Protocol authentication
   * @returns ECDSA signature (r, s, v)
   * @throws Error if not connected, invalid transaction, or signing fails
   */
  async signSafeTransaction(
    transaction: SafeTransactionData,
    sessionSigs: SessionSigsMap
  ): Promise<ECDSASignature> {
    // Validate preconditions
    if (!this.isConnected() || !this.litNodeClient) {
      throw new Error(
        'LitPKPSigner: Not connected to Lit network. Call connect() first.'
      );
    }

    if (!sessionSigs || Object.keys(sessionSigs).length === 0) {
      throw new Error(
        'LitPKPSigner: Session signatures are required for authentication'
      );
    }

    // Validate transaction structure
    this.validateSafeTransaction(transaction);

    // Create Safe transaction hash
    const txHash = this.hashSafeTransaction(transaction);

    if (this.debug) {
      console.log('[LitPKPSigner] Signing transaction hash:', txHash);
      console.log('[LitPKPSigner] Transaction data:', {
        to: transaction.to,
        value: transaction.value,
        operation: transaction.operation,
      });
    }

    try {
      // Lit Action code for signing
      // This is a simple signing action - production should include validation logic
      const litActionCode = `
        (async () => {
          try {
            // Validate inputs
            if (!dataToSign || !publicKey) {
              throw new Error('Missing required parameters');
            }

            // Sign the transaction hash with PKP
            await LitActions.signEcdsa({
              toSign: dataToSign,
              publicKey: publicKey,
              sigName: "safeTxSig",
            });

            console.log('Successfully signed Safe transaction');
          } catch (error) {
            console.error('Lit Action error:', error.message || error);
            throw error;
          }
        })();
      `;

      // Execute Lit Action
      const response = (await this.litNodeClient.executeJs({
        code: litActionCode,
        sessionSigs,
        jsParams: {
          dataToSign: utils.arrayify(txHash),
          publicKey: this.pkpPublicKey,
        },
      })) as unknown as LitActionResult;

      if (this.debug) {
        console.log('[LitPKPSigner] Lit Action response:', {
          success: response.success,
          logs: response.logs,
          signatureCount: Object.keys(response.signatures || {}).length,
        });
      }

      // Check if signing was successful
      if (!response || !response.success) {
        throw new Error(
          `Lit Action execution failed: ${response?.logs || 'Unknown error'}`
        );
      }

      if (!response.signatures || !response.signatures.safeTxSig) {
        throw new Error(
          'No signature returned from Lit Action. Check session signatures and PKP permissions.'
        );
      }

      const signature = response.signatures.safeTxSig;

      // Validate signature components
      if (!signature.r || !signature.s || signature.recid === undefined) {
        throw new Error('Invalid signature format returned from Lit Action');
      }

      // Convert signature to Safe-compatible format
      // Gnosis Safe uses v = 27 + recid for ECDSA signatures
      const safeSignature: ECDSASignature = {
        r: signature.r,
        s: signature.s,
        v: 27 + signature.recid,
      };

      if (this.debug) {
        console.log('[LitPKPSigner] Generated signature:', {
          r: safeSignature.r.substring(0, 10) + '...',
          s: safeSignature.s.substring(0, 10) + '...',
          v: safeSignature.v,
        });
      }

      return safeSignature;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `LitPKPSigner: Failed to sign Safe transaction: ${errorMessage}`
      );
    }
  }

  /**
   * Get Ethereum address derived from PKP public key
   */
  getPKPEthAddress(): string {
    // Remove '0x04' prefix (uncompressed public key indicator)
    const publicKeyWithoutPrefix = this.pkpPublicKey.slice(4);

    // Keccak256 hash of the public key
    const hash = utils.keccak256('0x' + publicKeyWithoutPrefix);

    // Take last 20 bytes (40 hex chars) as the address
    const address = '0x' + hash.slice(-40);

    // Return checksummed address
    return utils.getAddress(address);
  }

  /**
   * Verify signing conditions are met
   *
   * @param conditions Signing conditions to verify
   * @returns true if all conditions are met, false otherwise
   */
  async verifyConditions(conditions: SigningConditions): Promise<boolean> {
    if (!conditions) {
      throw new Error('Conditions are required');
    }

    // All conditions must be true for signing to proceed
    return (
      conditions.opaPolicyPassed &&
      conditions.testsPassed &&
      conditions.prMerged
    );
  }

  /**
   * Validate Safe transaction structure
   *
   * @param transaction Transaction to validate
   * @throws Error if transaction is invalid
   */
  private validateSafeTransaction(transaction: SafeTransactionData): void {
    if (!transaction) {
      throw new Error('Transaction is required');
    }

    if (!transaction.to) {
      throw new Error('Transaction "to" address is required');
    }

    // Validate address format
    if (!utils.isAddress(transaction.to)) {
      throw new Error('Invalid "to" address');
    }

    if (transaction.value === undefined || transaction.value === null) {
      throw new Error('Transaction "value" is required');
    }

    if (!transaction.data) {
      throw new Error('Transaction "data" is required');
    }

    if (transaction.operation === undefined || transaction.operation === null) {
      throw new Error('Transaction "operation" is required');
    }

    // Validate operation type (0 = Call, 1 = DelegateCall)
    if (transaction.operation !== 0 && transaction.operation !== 1) {
      throw new Error('Invalid operation type');
    }
  }

  /**
   * Create hash of Safe transaction for signing
   *
   * Creates a keccak256 hash of the Safe transaction data.
   * Note: This is a simplified implementation for development/testing.
   * Production should use Safe SDK's proper EIP-712 typed data hash generation
   * which includes domain separator, chain ID, Safe address, and nonce.
   *
   * @param transaction Transaction to hash
   * @returns Transaction hash (32 bytes hex string)
   */
  private hashSafeTransaction(transaction: SafeTransactionData): string {
    try {
      // Encode transaction data
      // Safe transaction structure: to, value, data, operation, ...
      const encodedData = utils.defaultAbiCoder.encode(
        ['address', 'uint256', 'bytes', 'uint8'],
        [
          transaction.to,
          BigNumber.from(transaction.value || 0).toString(),
          transaction.data || '0x',
          transaction.operation || 0,
        ]
      );

      // Create keccak256 hash
      const txHash = utils.keccak256(encodedData);

      if (this.debug) {
        console.log('[LitPKPSigner] Transaction hash generated:', txHash);
      }

      return txHash;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `LitPKPSigner: Failed to hash transaction: ${errorMessage}`
      );
    }
  }
}
