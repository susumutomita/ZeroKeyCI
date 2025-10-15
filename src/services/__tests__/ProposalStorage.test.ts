import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  FileStorageAdapter,
  InMemoryStorageAdapter,
  getStorage,
  setStorage,
  resetStorage,
} from '../ProposalStorage';
import { ProposalWithMetadata } from '@/types/api';

// Mock fs module
vi.mock('fs');

describe('ProposalStorage', () => {
  const mockProposal: ProposalWithMetadata = {
    id: 'test-id-1',
    transaction: {
      to: '0x1234567890123456789012345678901234567890',
      value: '0',
      data: '0x608060',
      operation: 0,
      safeTxGas: '5000000',
      baseGas: '0',
      gasPrice: '0',
      gasToken: '0x0000000000000000000000000000000000000000',
      refundReceiver: '0x0000000000000000000000000000000000000000',
      nonce: 0,
    },
    metadata: {
      contractName: 'TestContract',
      network: 'sepolia',
      safeAddress: '0x742D35CC6634c0532925A3b844BC9E7595F0BEb0',
      requestor: 'test@example.com',
    },
    status: 'pending',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    validationHash: '0xvalidationhash',
  };

  describe('FileStorageAdapter', () => {
    let adapter: FileStorageAdapter;
    const testStorageDir = '/test/storage';
    const testStorageFile = path.join(testStorageDir, 'proposals.json');

    beforeEach(() => {
      vi.clearAllMocks();
      // Mock fs functions
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify([]));
      vi.mocked(fs.writeFileSync).mockReturnValue(undefined);
      vi.mocked(fs.mkdirSync).mockReturnValue(undefined);

      adapter = new FileStorageAdapter(testStorageDir);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create storage directory if it does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValueOnce(false);
      new FileStorageAdapter(testStorageDir);

      expect(fs.mkdirSync).toHaveBeenCalledWith(testStorageDir, {
        recursive: true,
      });
    });

    it('should create storage file if it does not exist', () => {
      vi.mocked(fs.existsSync)
        .mockReturnValueOnce(true) // directory exists
        .mockReturnValueOnce(false); // file does not exist

      new FileStorageAdapter(testStorageDir);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        testStorageFile,
        JSON.stringify([]),
        'utf-8'
      );
    });

    it('should get all proposals', async () => {
      const proposals = [mockProposal];
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(proposals));

      const result = await adapter.getAll();

      expect(result).toEqual(proposals);
    });

    it('should return empty array if file read fails', async () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('File read error');
      });

      const result = await adapter.getAll();

      expect(result).toEqual([]);
    });

    it('should get proposal by id', async () => {
      const proposals = [mockProposal];
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(proposals));

      const result = await adapter.getById('test-id-1');

      expect(result).toEqual(mockProposal);
    });

    it('should return null if proposal not found', async () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify([]));

      const result = await adapter.getById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should create a new proposal', async () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify([]));

      await adapter.create(mockProposal);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        testStorageFile,
        JSON.stringify([mockProposal], null, 2)
      );
    });

    it('should update an existing proposal', async () => {
      const existingProposal = { ...mockProposal };
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify([existingProposal])
      );

      const updatedProposal = {
        ...mockProposal,
        status: 'approved' as const,
      };

      await adapter.update('test-id-1', updatedProposal);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        testStorageFile,
        JSON.stringify([updatedProposal], null, 2)
      );
    });

    it('should not update if proposal not found', async () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify([]));
      const writeFileSync = vi.mocked(fs.writeFileSync);
      writeFileSync.mockClear();

      await adapter.update('non-existent-id', mockProposal);

      // Should not write if proposal not found
      expect(writeFileSync).not.toHaveBeenCalled();
    });

    it('should delete a proposal', async () => {
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify([mockProposal])
      );

      await adapter.delete('test-id-1');

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        testStorageFile,
        JSON.stringify([], null, 2)
      );
    });

    it('should handle delete for non-existent proposal', async () => {
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify([mockProposal])
      );

      await adapter.delete('non-existent-id');

      // Should still write, but with the original proposal
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        testStorageFile,
        JSON.stringify([mockProposal], null, 2)
      );
    });

    it('should use default storage directory if not provided', () => {
      const adapter = new FileStorageAdapter();
      const expectedPath = path.join(process.cwd(), '.zerokey', 'storage');

      // Verify the constructor was called with correct path
      expect(fs.existsSync).toHaveBeenCalledWith(expectedPath);
    });
  });

  describe('InMemoryStorageAdapter', () => {
    let adapter: InMemoryStorageAdapter;

    beforeEach(() => {
      adapter = new InMemoryStorageAdapter();
    });

    it('should get all proposals', async () => {
      await adapter.create(mockProposal);

      const result = await adapter.getAll();

      expect(result).toEqual([mockProposal]);
    });

    it('should get proposal by id', async () => {
      await adapter.create(mockProposal);

      const result = await adapter.getById('test-id-1');

      expect(result).toEqual(mockProposal);
    });

    it('should return null if proposal not found', async () => {
      const result = await adapter.getById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should create a new proposal', async () => {
      await adapter.create(mockProposal);

      const result = await adapter.getById('test-id-1');

      expect(result).toEqual(mockProposal);
    });

    it('should update an existing proposal', async () => {
      await adapter.create(mockProposal);

      const updatedProposal = {
        ...mockProposal,
        status: 'approved' as const,
      };

      await adapter.update('test-id-1', updatedProposal);

      const result = await adapter.getById('test-id-1');

      expect(result?.status).toBe('approved');
    });

    it('should not update if proposal not found', async () => {
      await adapter.update('non-existent-id', mockProposal);

      const result = await adapter.getById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should delete a proposal', async () => {
      await adapter.create(mockProposal);
      await adapter.delete('test-id-1');

      const result = await adapter.getById('test-id-1');

      expect(result).toBeNull();
    });

    it('should clear all proposals', async () => {
      await adapter.create(mockProposal);
      await adapter.create({ ...mockProposal, id: 'test-id-2' });

      adapter.clear();

      const result = await adapter.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getStorage', () => {
    beforeEach(() => {
      resetStorage();
      delete process.env.STORAGE_TYPE;
      delete process.env.STORAGE_DIR;
      vi.clearAllMocks();
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify([]));
      vi.mocked(fs.writeFileSync).mockReturnValue(undefined);
    });

    afterEach(() => {
      resetStorage();
      vi.restoreAllMocks();
    });

    it('should return FileStorageAdapter by default', () => {
      const storage = getStorage();

      expect(storage).toBeInstanceOf(FileStorageAdapter);
    });

    it('should return InMemoryStorageAdapter when STORAGE_TYPE is memory', () => {
      process.env.STORAGE_TYPE = 'memory';

      const storage = getStorage();

      expect(storage).toBeInstanceOf(InMemoryStorageAdapter);
    });

    it('should use custom STORAGE_DIR', () => {
      process.env.STORAGE_DIR = '/custom/path';

      getStorage();

      expect(fs.existsSync).toHaveBeenCalledWith('/custom/path');
    });

    it('should return same instance on multiple calls', () => {
      const storage1 = getStorage();
      const storage2 = getStorage();

      expect(storage1).toBe(storage2);
    });
  });

  describe('setStorage', () => {
    it('should allow setting custom storage adapter', async () => {
      const customAdapter = new InMemoryStorageAdapter();
      setStorage(customAdapter);

      const storage = getStorage();

      expect(storage).toBe(customAdapter);
    });
  });

  describe('resetStorage', () => {
    it('should reset storage instance', () => {
      const storage1 = getStorage();
      resetStorage();
      const storage2 = getStorage();

      expect(storage1).not.toBe(storage2);
    });
  });
});
