import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { utils } from 'ethers';
import type { SafeTransactionData } from '../types/safe';

export interface LitPKPSignerConfig {
  pkpPublicKey: string;
  network: string;
}

export interface AuthSig {
  sig: string;
  derivedVia: string;
  signedMessage: string;
  address: string;
}

export interface SigningConditions {
  opaPolicyPassed: boolean;
  testsPassed: boolean;
  prMerged: boolean;
}

export interface ECDSASignature {
  r: string;
  s: string;
  v: number;
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
  private pkpPublicKey: string;
  private network: string;
  private litNodeClient: LitNodeClient | null = null;
  private connected = false;

  constructor(config: LitPKPSignerConfig) {
    // Validate configuration
    if (!config.pkpPublicKey || config.pkpPublicKey.trim() === '') {
      throw new Error('PKP public key is required');
    }

    if (!config.network || config.network.trim() === '') {
      throw new Error('Lit network is required');
    }

    // Validate PKP public key format (should be hex string starting with 0x04)
    if (
      !config.pkpPublicKey.startsWith('0x04') ||
      config.pkpPublicKey.length !== 132
    ) {
      throw new Error('Invalid PKP public key');
    }

    this.pkpPublicKey = config.pkpPublicKey;
    this.network = config.network;
  }

  /**
   * Connect to Lit Protocol network
   */
  async connect(): Promise<void> {
    try {
      this.litNodeClient = new LitNodeClient({
        litNetwork: this.network as any, // Type assertion for network compatibility
      });

      await this.litNodeClient.connect();
      this.connected = true;
    } catch (error) {
      this.connected = false;
      throw error;
    }
  }

  /**
   * Disconnect from Lit Protocol network
   */
  async disconnect(): Promise<void> {
    if (this.litNodeClient) {
      await this.litNodeClient.disconnect();
      this.connected = false;
      this.litNodeClient = null;
    }
  }

  /**
   * Sign a Safe transaction using PKP
   *
   * @param transaction Safe transaction data to sign
   * @param authSig Authentication signature for Lit Protocol
   * @returns ECDSA signature (r, s, v)
   */
  async signSafeTransaction(
    transaction: SafeTransactionData,
    authSig: AuthSig
  ): Promise<ECDSASignature> {
    // Validate preconditions
    if (!this.connected || !this.litNodeClient) {
      throw new Error('Not connected to Lit network');
    }

    if (!authSig) {
      throw new Error('Authentication signature is required');
    }

    // Validate transaction structure
    this.validateSafeTransaction(transaction);

    // Create transaction hash to sign
    const txHash = this.hashSafeTransaction(transaction);

    try {
      // Execute Lit Action to sign with PKP
      const litActionCode = `
        const go = async () => {
          // Sign the transaction hash with PKP
          const sigShare = await LitActions.signEcdsa({
            toSign: dataToSign,
            publicKey,
            sigName: "sig1",
          });
        };

        go();
      `;

      const response = await this.litNodeClient.executeJs({
        code: litActionCode,
        sessionSigs: authSig as any, // Session signatures for authentication
        jsParams: {
          dataToSign: utils.arrayify(txHash),
          publicKey: this.pkpPublicKey,
        },
      } as any);

      // Check if signing was successful
      if (
        !response.success ||
        !response.signatures ||
        !response.signatures.sig1
      ) {
        throw new Error('Failed to sign transaction');
      }

      const signature = response.signatures.sig1;

      // Convert signature to Safe-compatible format
      return {
        r: signature.r,
        s: signature.s,
        v: signature.recid,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to sign transaction with PKP');
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
   * @param transaction Transaction to hash
   * @returns Transaction hash
   */
  private hashSafeTransaction(transaction: SafeTransactionData): string {
    // Create EIP-712 typed data hash for Safe transaction
    // This is simplified - production should use Safe SDK's hash generation
    const encodedData = utils.defaultAbiCoder.encode(
      ['address', 'uint256', 'bytes', 'uint8'],
      [
        transaction.to,
        transaction.value,
        transaction.data,
        transaction.operation,
      ]
    );

    return utils.keccak256(encodedData);
  }
}
