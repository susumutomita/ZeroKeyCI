import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getNetworkConfig,
  getNetworkByChainId,
  getNetworkName,
  isTestnet,
  getSupportedNetworks,
  getSupportedChainIds,
  isSupportedChainId,
  getRpcUrl,
  getExplorerAddressUrl,
  getExplorerTxUrl,
  type SupportedNetwork,
} from '../network-config';

describe('network-config', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getNetworkConfig', () => {
    it('should return config for mainnet', () => {
      const config = getNetworkConfig('mainnet');
      expect(config.chainId).toBe(1);
      expect(config.name).toBe('Ethereum Mainnet');
      expect(config.testnet).toBe(false);
      expect(config.currency.symbol).toBe('ETH');
    });

    it('should return config for sepolia', () => {
      const config = getNetworkConfig('sepolia');
      expect(config.chainId).toBe(11155111);
      expect(config.name).toBe('Ethereum Sepolia Testnet');
      expect(config.testnet).toBe(true);
    });

    it('should return config for polygon', () => {
      const config = getNetworkConfig('polygon');
      expect(config.chainId).toBe(137);
      expect(config.name).toBe('Polygon');
      expect(config.testnet).toBe(false);
      expect(config.currency.symbol).toBe('MATIC');
    });

    it('should return config for arbitrum', () => {
      const config = getNetworkConfig('arbitrum');
      expect(config.chainId).toBe(42161);
      expect(config.name).toBe('Arbitrum One');
      expect(config.testnet).toBe(false);
    });

    it('should return config for optimism', () => {
      const config = getNetworkConfig('optimism');
      expect(config.chainId).toBe(10);
      expect(config.name).toBe('Optimism');
      expect(config.testnet).toBe(false);
    });

    it('should return config for base', () => {
      const config = getNetworkConfig('base');
      expect(config.chainId).toBe(8453);
      expect(config.name).toBe('Base');
      expect(config.testnet).toBe(false);
    });

    it('should throw error for unsupported network', () => {
      expect(() => getNetworkConfig('unknown' as SupportedNetwork)).toThrow(
        'Unsupported network'
      );
    });
  });

  describe('getNetworkByChainId', () => {
    it('should return mainnet config for chain ID 1', () => {
      const config = getNetworkByChainId(1);
      expect(config).not.toBeNull();
      expect(config?.name).toBe('Ethereum Mainnet');
    });

    it('should return sepolia config for chain ID 11155111', () => {
      const config = getNetworkByChainId(11155111);
      expect(config).not.toBeNull();
      expect(config?.name).toBe('Ethereum Sepolia Testnet');
    });

    it('should return polygon config for chain ID 137', () => {
      const config = getNetworkByChainId(137);
      expect(config).not.toBeNull();
      expect(config?.name).toBe('Polygon');
    });

    it('should return null for unsupported chain ID', () => {
      const config = getNetworkByChainId(999999);
      expect(config).toBeNull();
    });
  });

  describe('getNetworkName', () => {
    it('should return mainnet for chain ID 1', () => {
      expect(getNetworkName(1)).toBe('mainnet');
    });

    it('should return sepolia for chain ID 11155111', () => {
      expect(getNetworkName(11155111)).toBe('sepolia');
    });

    it('should return polygon for chain ID 137', () => {
      expect(getNetworkName(137)).toBe('polygon');
    });

    it('should return arbitrum for chain ID 42161', () => {
      expect(getNetworkName(42161)).toBe('arbitrum');
    });

    it('should return optimism for chain ID 10', () => {
      expect(getNetworkName(10)).toBe('optimism');
    });

    it('should return base for chain ID 8453', () => {
      expect(getNetworkName(8453)).toBe('base');
    });

    it('should return null for unsupported chain ID', () => {
      expect(getNetworkName(999999)).toBeNull();
    });
  });

  describe('isTestnet', () => {
    it('should return false for mainnet', () => {
      expect(isTestnet('mainnet')).toBe(false);
    });

    it('should return true for sepolia', () => {
      expect(isTestnet('sepolia')).toBe(true);
    });

    it('should return false for polygon', () => {
      expect(isTestnet('polygon')).toBe(false);
    });

    it('should return false for arbitrum', () => {
      expect(isTestnet('arbitrum')).toBe(false);
    });

    it('should return false for optimism', () => {
      expect(isTestnet('optimism')).toBe(false);
    });

    it('should return false for base', () => {
      expect(isTestnet('base')).toBe(false);
    });
  });

  describe('getSupportedNetworks', () => {
    it('should return all supported network names', () => {
      const networks = getSupportedNetworks();
      expect(networks).toContain('mainnet');
      expect(networks).toContain('sepolia');
      expect(networks).toContain('polygon');
      expect(networks).toContain('arbitrum');
      expect(networks).toContain('optimism');
      expect(networks).toContain('base');
      expect(networks).toHaveLength(6);
    });
  });

  describe('getSupportedChainIds', () => {
    it('should return all supported chain IDs', () => {
      const chainIds = getSupportedChainIds();
      expect(chainIds).toContain(1); // mainnet
      expect(chainIds).toContain(11155111); // sepolia
      expect(chainIds).toContain(137); // polygon
      expect(chainIds).toContain(42161); // arbitrum
      expect(chainIds).toContain(10); // optimism
      expect(chainIds).toContain(8453); // base
      expect(chainIds).toHaveLength(6);
    });
  });

  describe('isSupportedChainId', () => {
    it('should return true for supported chain IDs', () => {
      expect(isSupportedChainId(1)).toBe(true); // mainnet
      expect(isSupportedChainId(11155111)).toBe(true); // sepolia
      expect(isSupportedChainId(137)).toBe(true); // polygon
      expect(isSupportedChainId(42161)).toBe(true); // arbitrum
      expect(isSupportedChainId(10)).toBe(true); // optimism
      expect(isSupportedChainId(8453)).toBe(true); // base
    });

    it('should return false for unsupported chain IDs', () => {
      expect(isSupportedChainId(999999)).toBe(false);
      expect(isSupportedChainId(5)).toBe(false); // goerli (deprecated)
    });
  });

  describe('getRpcUrl', () => {
    it('should return RPC URL from environment variable for mainnet', () => {
      process.env.MAINNET_RPC_URL = 'https://eth-mainnet.example.com';
      expect(getRpcUrl('mainnet')).toBe('https://eth-mainnet.example.com');
    });

    it('should return RPC URL from environment variable for sepolia', () => {
      process.env.SEPOLIA_RPC_URL = 'https://eth-sepolia.example.com';
      expect(getRpcUrl('sepolia')).toBe('https://eth-sepolia.example.com');
    });

    it('should return undefined when RPC URL is not set', () => {
      delete process.env.MAINNET_RPC_URL;
      expect(getRpcUrl('mainnet')).toBeUndefined();
    });

    it('should use correct environment variable name', () => {
      process.env.POLYGON_RPC_URL = 'https://polygon.example.com';
      expect(getRpcUrl('polygon')).toBe('https://polygon.example.com');
    });
  });

  describe('getExplorerAddressUrl', () => {
    it('should return etherscan URL for mainnet address', () => {
      const address = '0x742D35CC6634c0532925A3b844BC9E7595F0BEb0';
      const url = getExplorerAddressUrl('mainnet', address);
      expect(url).toBe(`https://etherscan.io/address/${address}`);
    });

    it('should return sepolia etherscan URL for sepolia address', () => {
      const address = '0x742D35CC6634c0532925A3b844BC9E7595F0BEb0';
      const url = getExplorerAddressUrl('sepolia', address);
      expect(url).toBe(`https://sepolia.etherscan.io/address/${address}`);
    });

    it('should return polygonscan URL for polygon address', () => {
      const address = '0x742D35CC6634c0532925A3b844BC9E7595F0BEb0';
      const url = getExplorerAddressUrl('polygon', address);
      expect(url).toBe(`https://polygonscan.com/address/${address}`);
    });

    it('should return arbiscan URL for arbitrum address', () => {
      const address = '0x742D35CC6634c0532925A3b844BC9E7595F0BEb0';
      const url = getExplorerAddressUrl('arbitrum', address);
      expect(url).toBe(`https://arbiscan.io/address/${address}`);
    });
  });

  describe('getExplorerTxUrl', () => {
    it('should return etherscan URL for mainnet transaction', () => {
      const txHash =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const url = getExplorerTxUrl('mainnet', txHash);
      expect(url).toBe(`https://etherscan.io/tx/${txHash}`);
    });

    it('should return sepolia etherscan URL for sepolia transaction', () => {
      const txHash =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const url = getExplorerTxUrl('sepolia', txHash);
      expect(url).toBe(`https://sepolia.etherscan.io/tx/${txHash}`);
    });

    it('should return polygonscan URL for polygon transaction', () => {
      const txHash =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const url = getExplorerTxUrl('polygon', txHash);
      expect(url).toBe(`https://polygonscan.com/tx/${txHash}`);
    });

    it('should return basescan URL for base transaction', () => {
      const txHash =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const url = getExplorerTxUrl('base', txHash);
      expect(url).toBe(`https://basescan.org/tx/${txHash}`);
    });
  });
});
