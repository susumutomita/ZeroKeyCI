import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync, writeFileSync } from 'fs';
import {
  loadPKPConfig,
  getLitActionCID,
  getOwnerPrivateKey,
  grantPermission,
  updatePKPConfig,
  main,
  type PermissionGrantResult,
} from '../grant-lit-action-permission';
import type { PKPConfig } from '../mint-pkp';

// Mock modules
vi.mock('fs');
vi.mock('@lit-protocol/lit-node-client', () => ({
  LitNodeClient: vi.fn(),
}));
vi.mock('@lit-protocol/constants', () => ({
  LitNetwork: {
    DatilDev: 'datil-dev',
    DatilTest: 'datil-test',
    Datil: 'datil',
  },
}));
vi.mock('readline', () => ({
  default: {
    createInterface: vi.fn(() => ({
      question: vi.fn(),
      close: vi.fn(),
    })),
  },
  createInterface: vi.fn(() => ({
    question: vi.fn(),
    close: vi.fn(),
  })),
}));

describe('grant-lit-action-permission', () => {
  let originalEnv: NodeJS.ProcessEnv;

  const mockPKPConfig: PKPConfig = {
    tokenId: '0x' + 'a'.repeat(64),
    publicKey: '0x04' + 'b'.repeat(128),
    ethAddress: '0x1234567890123456789012345678901234567890',
    network: 'datil-dev',
    mintedAt: '2025-10-18T07:00:00.000Z',
  };

  beforeEach(() => {
    originalEnv = { ...process.env };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('loadPKPConfig', () => {
    it('should load and parse PKP config file', () => {
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPKPConfig));

      const config = loadPKPConfig();

      expect(readFileSync).toHaveBeenCalledWith(
        '.zerokey/pkp-config.json',
        'utf-8'
      );
      expect(config).toEqual(mockPKPConfig);
    });

    it('should use custom config path', () => {
      const customPath = '/custom/config.json';
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPKPConfig));

      const config = loadPKPConfig(customPath);

      expect(readFileSync).toHaveBeenCalledWith(customPath, 'utf-8');
      expect(config).toEqual(mockPKPConfig);
    });

    it('should use environment variable for config path', () => {
      process.env.PKP_CONFIG_PATH = '/env/config.json';
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPKPConfig));

      const config = loadPKPConfig();

      expect(readFileSync).toHaveBeenCalledWith('/env/config.json', 'utf-8');
    });

    it('should throw error when config file not found', () => {
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('ENOENT');
      });

      expect(() => loadPKPConfig()).toThrow(
        'Failed to load PKP config from .zerokey/pkp-config.json. Run mint-pkp.ts first.'
      );
    });

    it('should throw error when config is invalid JSON', () => {
      vi.mocked(readFileSync).mockReturnValue('invalid json');

      expect(() => loadPKPConfig()).toThrow();
    });
  });

  describe('getLitActionCID', () => {
    it('should use environment variable when set', async () => {
      const cid = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      process.env.LIT_ACTION_IPFS_CID = cid;

      const result = await getLitActionCID();
      expect(result).toBe(cid);
    });

    it('should prompt user when environment variable not set', async () => {
      delete process.env.LIT_ACTION_IPFS_CID;

      const cid = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      const readline = await import('readline');
      const mockRl = {
        question: vi.fn((q: string, cb: (answer: string) => void) => {
          cb(cid);
        }),
        close: vi.fn(),
      };
      vi.mocked(readline.createInterface).mockReturnValue(mockRl as any);

      const result = await getLitActionCID();
      expect(result).toBe(cid);
    });

    it('should throw error for invalid IPFS CID format', async () => {
      delete process.env.LIT_ACTION_IPFS_CID;

      const readline = await import('readline');
      const mockRl = {
        question: vi.fn((q: string, cb: (answer: string) => void) => {
          cb('invalid-cid');
        }),
        close: vi.fn(),
      };
      vi.mocked(readline.createInterface).mockReturnValue(mockRl as any);

      await expect(getLitActionCID()).rejects.toThrow('Invalid IPFS CID');
    });

    it('should throw error for empty IPFS CID', async () => {
      delete process.env.LIT_ACTION_IPFS_CID;

      const readline = await import('readline');
      const mockRl = {
        question: vi.fn((q: string, cb: (answer: string) => void) => {
          cb('');
        }),
        close: vi.fn(),
      };
      vi.mocked(readline.createInterface).mockReturnValue(mockRl as any);

      await expect(getLitActionCID()).rejects.toThrow('Invalid IPFS CID');
    });
  });

  describe('getOwnerPrivateKey', () => {
    it('should use environment variable when set', async () => {
      const key =
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      process.env.ETHEREUM_PRIVATE_KEY = key;

      const result = await getOwnerPrivateKey();
      expect(result).toBe(key);
    });

    it('should prompt user when environment variable not set', async () => {
      delete process.env.ETHEREUM_PRIVATE_KEY;

      const key =
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      const readline = await import('readline');
      const mockRl = {
        question: vi.fn((q: string, cb: (answer: string) => void) => {
          cb(key);
        }),
        close: vi.fn(),
      };
      vi.mocked(readline.createInterface).mockReturnValue(mockRl as any);

      const result = await getOwnerPrivateKey();
      expect(result).toBe(key);
    });

    it('should throw error for invalid private key', async () => {
      delete process.env.ETHEREUM_PRIVATE_KEY;

      const readline = await import('readline');
      const mockRl = {
        question: vi.fn((q: string, cb: (answer: string) => void) => {
          cb('invalid-key');
        }),
        close: vi.fn(),
      };
      vi.mocked(readline.createInterface).mockReturnValue(mockRl as any);

      await expect(getOwnerPrivateKey()).rejects.toThrow('Invalid private key');
    });
  });

  describe('grantPermission', () => {
    it('should grant permission successfully', async () => {
      const litActionCID = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      const ownerPrivateKey =
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

      const mockConnect = vi.fn().mockResolvedValue(undefined);
      const mockDisconnect = vi.fn().mockResolvedValue(undefined);

      const { LitNodeClient } = await import('@lit-protocol/lit-node-client');
      vi.mocked(LitNodeClient).mockImplementation(
        () =>
          ({
            connect: mockConnect,
            disconnect: mockDisconnect,
          }) as any
      );

      const result = await grantPermission(
        mockPKPConfig,
        litActionCID,
        ownerPrivateKey
      );

      expect(mockConnect).toHaveBeenCalled();
      expect(mockDisconnect).toHaveBeenCalled();
      expect(result).toHaveProperty('pkpTokenId', mockPKPConfig.tokenId);
      expect(result).toHaveProperty('litActionIpfsCid', litActionCID);
      expect(result).toHaveProperty('grantedAt');
      expect(new Date(result.grantedAt).getTime()).toBeLessThanOrEqual(
        Date.now()
      );
    });

    it('should throw error on connection failure', async () => {
      const litActionCID = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      const ownerPrivateKey =
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

      const mockConnect = vi
        .fn()
        .mockRejectedValue(new Error('Connection failed'));

      const { LitNodeClient } = await import('@lit-protocol/lit-node-client');
      vi.mocked(LitNodeClient).mockImplementation(
        () =>
          ({
            connect: mockConnect,
          }) as any
      );

      await expect(
        grantPermission(mockPKPConfig, litActionCID, ownerPrivateKey)
      ).rejects.toThrow('Failed to grant permission: Connection failed');
    });

    it('should use correct Lit network from PKP config', async () => {
      const litActionCID = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      const ownerPrivateKey =
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

      const mockConnect = vi.fn().mockResolvedValue(undefined);
      const mockDisconnect = vi.fn().mockResolvedValue(undefined);

      let capturedOptions: any;
      const { LitNodeClient } = await import('@lit-protocol/lit-node-client');
      vi.mocked(LitNodeClient).mockImplementation((options) => {
        capturedOptions = options;
        return {
          connect: mockConnect,
          disconnect: mockDisconnect,
        } as any;
      });

      await grantPermission(mockPKPConfig, litActionCID, ownerPrivateKey);

      expect(capturedOptions.litNetwork).toBe(mockPKPConfig.network);
    });
  });

  describe('updatePKPConfig', () => {
    it('should update PKP config with Lit Action CID', () => {
      const litActionCID = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      vi.mocked(writeFileSync).mockImplementation(() => {});

      updatePKPConfig(mockPKPConfig, litActionCID);

      expect(writeFileSync).toHaveBeenCalled();

      const call = vi.mocked(writeFileSync).mock.calls[0];
      expect(call[0]).toBe('.zerokey/pkp-config.json');

      const updatedConfig = JSON.parse(call[1] as string);
      expect(updatedConfig.tokenId).toBe(mockPKPConfig.tokenId);
      expect(updatedConfig.litActionIpfsCid).toBe(litActionCID);
      expect(updatedConfig.permissionGrantedAt).toBeDefined();
    });

    it('should use custom config path', () => {
      const litActionCID = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      const customPath = '/custom/config.json';
      vi.mocked(writeFileSync).mockImplementation(() => {});

      updatePKPConfig(mockPKPConfig, litActionCID, customPath);

      const call = vi.mocked(writeFileSync).mock.calls[0];
      expect(call[0]).toBe(customPath);
    });

    it('should preserve existing config fields', () => {
      const litActionCID = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      vi.mocked(writeFileSync).mockImplementation(() => {});

      updatePKPConfig(mockPKPConfig, litActionCID);

      const call = vi.mocked(writeFileSync).mock.calls[0];
      const updatedConfig = JSON.parse(call[1] as string);

      expect(updatedConfig.tokenId).toBe(mockPKPConfig.tokenId);
      expect(updatedConfig.publicKey).toBe(mockPKPConfig.publicKey);
      expect(updatedConfig.ethAddress).toBe(mockPKPConfig.ethAddress);
      expect(updatedConfig.network).toBe(mockPKPConfig.network);
      expect(updatedConfig.mintedAt).toBe(mockPKPConfig.mintedAt);
    });
  });

  describe('main', () => {
    it('should complete full permission granting workflow', async () => {
      const litActionCID = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      const ownerPrivateKey =
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

      process.env.LIT_ACTION_IPFS_CID = litActionCID;
      process.env.ETHEREUM_PRIVATE_KEY = ownerPrivateKey;

      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPKPConfig));
      vi.mocked(writeFileSync).mockImplementation(() => {});

      const mockConnect = vi.fn().mockResolvedValue(undefined);
      const mockDisconnect = vi.fn().mockResolvedValue(undefined);

      const { LitNodeClient } = await import('@lit-protocol/lit-node-client');
      vi.mocked(LitNodeClient).mockImplementation(
        () =>
          ({
            connect: mockConnect,
            disconnect: mockDisconnect,
          }) as any
      );

      const result = await main();

      expect(result).toHaveProperty('pkpTokenId');
      expect(result).toHaveProperty('litActionIpfsCid');
      expect(result).toHaveProperty('grantedAt');
      expect(result.litActionIpfsCid).toBe(litActionCID);
    });

    it('should exit with error code on failure', async () => {
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('Config not found');
      });

      const mockExit = vi
        .spyOn(process, 'exit')
        .mockImplementation((() => {}) as any);
      const mockConsoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await main();

      expect(mockExit).toHaveBeenCalledWith(1);
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error'),
        expect.any(String)
      );

      mockExit.mockRestore();
      mockConsoleError.mockRestore();
    });
  });
});
