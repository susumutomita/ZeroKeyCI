import { describe, it, expect, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from '../route';
import { NextRequest } from 'next/server';
import {
  setStorage,
  InMemoryStorageAdapter,
} from '@/services/ProposalStorage';

// Use in-memory storage for tests
const testStorage = new InMemoryStorageAdapter();

// Helper to create NextRequest
const createRequest = (
  method: string,
  url: string,
  body?: Record<string, unknown>
) => {
  const request = new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    ...(body && {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
  });
  return request;
};

describe('GET /api/proposals/[id]', () => {
  beforeEach(() => {
    // Clear storage and set test adapter
    testStorage.clear();
    setStorage(testStorage);
  });

  it('should return 404 when proposal not found', async () => {
    const request = createRequest('GET', '/api/proposals/test-id');
    const params = { id: 'test-id' };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      success: false,
      error: 'Proposal not found',
    });
  });

  it('should return proposal when found', async () => {
    // Setup: Add a proposal to storage
    await testStorage.create({
      id: 'test-id',
      proposal: {
        to: '0x123',
        value: '0',
        data: '0x',
        operation: 0,
      },
      safeAddress: '0x123',
      chainId: 11155111,
      network: 'sepolia',
      contractName: 'TestContract',
      validationHash: '0xhash',
      status: 'pending',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      metadata: {},
    });

    const request = createRequest('GET', '/api/proposals/test-id');
    const params = { id: 'test-id' };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.proposal.id).toBe('test-id');
  });

  it('should handle errors gracefully', async () => {
    await testStorage.create({
      id: 'test-id',
      proposal: { to: '0x123', value: '0', data: '0x', operation: 0 },
      safeAddress: '0x123',
      chainId: 11155111,
      network: 'sepolia',
      contractName: 'TestContract',
      validationHash: '0xhash',
      status: 'pending',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      metadata: {},
    });

    const request = createRequest('GET', '/api/proposals/test-id');

    // Mock storage to throw error
    const mockStorage = {
      ...testStorage,
      getById: vi.fn().mockRejectedValue(new Error('Mock error')),
    };
    setStorage(mockStorage as any);

    const response = await GET(request, { params: { id: 'test-id' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();

    // Restore
    setStorage(testStorage);
  });

  it('should handle non-Error exceptions in GET', async () => {
    const request = createRequest('GET', '/api/proposals/test-id');

    // Mock global.proposals to throw a non-Error object
    Object.defineProperty(global, 'proposals', {
      get: () => {
        throw 'String error'; // Non-Error object
      },
      configurable: true,
    });

    const response = await GET(request, { params: { id: 'test-id' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unknown error');

    // Restore
    Object.defineProperty(global, 'proposals', {
      value: [],
      writable: true,
      configurable: true,
    });
  });
});

describe('PATCH /api/proposals/[id]', () => {
  beforeEach(() => {
    testStorage.clear();
    setStorage(testStorage);
  });

  it('should return 404 when proposal not found', async () => {
    const request = createRequest('PATCH', '/api/proposals/test-id', {
      status: 'executed',
    });
    const params = { id: 'test-id' };

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      success: false,
      error: 'Proposal not found',
    });
  });

  it('should update proposal status', async () => {
    global.proposals = [
      {
        id: 'test-id',
        transaction: { to: '0x123', value: '0', data: '0x', operation: 0 },
        status: 'pending',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        metadata: {},
      },
    ];

    const request = createRequest('PATCH', '/api/proposals/test-id', {
      status: 'executed',
    });
    const params = { id: 'test-id' };

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.proposal.status).toBe('executed');
    expect(data.proposal.updatedAt).not.toBe('2025-01-01T00:00:00.000Z');
  });

  it('should store transaction hash when provided', async () => {
    global.proposals = [
      {
        id: 'test-id',
        transaction: { to: '0x123', value: '0', data: '0x', operation: 0 },
        status: 'pending',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        metadata: {},
      },
    ];

    const request = createRequest('PATCH', '/api/proposals/test-id', {
      status: 'executed',
      txHash: '0xabcdef',
    });
    const params = { id: 'test-id' };

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.proposal.metadata.txHash).toBe('0xabcdef');
  });

  it('should store error when provided', async () => {
    global.proposals = [
      {
        id: 'test-id',
        transaction: { to: '0x123', value: '0', data: '0x', operation: 0 },
        status: 'pending',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        metadata: {},
      },
    ];

    const request = createRequest('PATCH', '/api/proposals/test-id', {
      error: 'Execution failed',
    });
    const params = { id: 'test-id' };

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.proposal.metadata.error).toBe('Execution failed');
  });

  it('should handle invalid JSON gracefully', async () => {
    const request = new NextRequest(
      new URL('/api/proposals/test-id', 'http://localhost:3000'),
      {
        method: 'PATCH',
        body: 'invalid json',
      }
    );
    const params = { id: 'test-id' };

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should handle non-Error exceptions in PATCH', async () => {
    const request = createRequest('PATCH', '/api/proposals/test-id', {});

    // Mock global.proposals to throw a non-Error object
    Object.defineProperty(global, 'proposals', {
      get: () => {
        throw { code: 500 }; // Non-Error object
      },
      configurable: true,
    });

    const response = await PATCH(request, { params: { id: 'test-id' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unknown error');

    // Restore
    Object.defineProperty(global, 'proposals', {
      value: [],
      writable: true,
      configurable: true,
    });
  });
});

describe('DELETE /api/proposals/[id]', () => {
  beforeEach(() => {
    global.proposals = [];
  });

  it('should return 404 when proposal not found', async () => {
    const request = createRequest('DELETE', '/api/proposals/test-id');
    const params = { id: 'test-id' };

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      success: false,
      error: 'Proposal not found',
    });
  });

  it('should delete pending proposal', async () => {
    global.proposals = [
      {
        id: 'test-id',
        transaction: { to: '0x123', value: '0', data: '0x', operation: 0 },
        status: 'pending',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        metadata: {},
      },
    ];

    const request = createRequest('DELETE', '/api/proposals/test-id');
    const params = { id: 'test-id' };

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(global.proposals.length).toBe(0);
  });

  it('should not delete executed proposal', async () => {
    global.proposals = [
      {
        id: 'test-id',
        transaction: { to: '0x123', value: '0', data: '0x', operation: 0 },
        status: 'executed',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        metadata: {},
      },
    ];

    const request = createRequest('DELETE', '/api/proposals/test-id');
    const params = { id: 'test-id' };

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Cannot delete proposal with status');
    expect(global.proposals.length).toBe(1);
  });

  it('should handle errors gracefully', async () => {
    global.proposals = [
      {
        id: 'test-id',
        transaction: { to: '0x123', value: '0', data: '0x', operation: 0 },
        status: 'pending',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        metadata: {},
      },
    ];

    const request = createRequest('DELETE', '/api/proposals/test-id');

    // Mock global.proposals to throw when accessed
    Object.defineProperty(global, 'proposals', {
      get: () => {
        throw new Error('Mock error');
      },
      configurable: true,
    });

    const response = await DELETE(request, { params: { id: 'test-id' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();

    // Restore
    Object.defineProperty(global, 'proposals', {
      value: [],
      writable: true,
      configurable: true,
    });
  });

  it('should handle non-Error exceptions in DELETE', async () => {
    const request = createRequest('DELETE', '/api/proposals/test-id');

    // Mock global.proposals to throw a non-Error object
    Object.defineProperty(global, 'proposals', {
      get: () => {
        throw null; // Non-Error object (null)
      },
      configurable: true,
    });

    const response = await DELETE(request, { params: { id: 'test-id' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unknown error');

    // Restore
    Object.defineProperty(global, 'proposals', {
      value: [],
      writable: true,
      configurable: true,
    });
  });
});
