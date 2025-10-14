import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock the SafeProposalBuilder
vi.mock('@/services/SafeProposalBuilder', () => {
  return {
    SafeProposalBuilder: class MockSafeProposalBuilder {
      constructor(config: any) {
        // Accept the config but don't use it in the mock
      }

      async createDeploymentProposal(data: any) {
        // Check for error flag to test error handling
        if (data.metadata && data.metadata._throwError) {
          throw new Error('Mock deployment error');
        }
        const proposal: any = {
          to: '0x0000000000000000000000000000000000000000',
          value: '0',
          data: '0x608060',
          operation: 0,
          safeTxGas: '5000000',
        };
        // Pass through _forceInvalid for validation testing
        if (data.metadata && data.metadata._forceInvalid) {
          proposal._forceInvalid = true;
        }
        return proposal;
      }

      validateProposal(proposal: any) {
        // Basic validation to match the real implementation
        // Check for _forceInvalid flag for testing validation failure
        if ((proposal as any)._forceInvalid) {
          return false;
        }
        if (!proposal || !proposal.data || !proposal.data.startsWith('0x')) {
          return false;
        }
        return true;
      }

      generateValidationHash(proposal: any) {
        return '0xvalidationhash';
      }
    },
  };
});

describe('API /api/proposals', () => {
  beforeEach(() => {
    // Reset global proposals storage if it exists
    if (typeof global !== 'undefined') {
      (global as any).proposals = [];
    }
  });

  describe('GET /api/proposals', () => {
    it('should return empty array when no proposals exist', async () => {
      const request = new NextRequest('http://localhost:3000/api/proposals');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.proposals).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('should filter proposals by network', async () => {
      // First create a proposal with network
      const postRequestBody = {
        contractName: 'TestContract',
        bytecode: '0x608060',
        network: 'sepolia',
      };
      const postRequest = new NextRequest(
        'http://localhost:3000/api/proposals',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postRequestBody),
        }
      );
      Object.defineProperty(postRequest, 'json', {
        value: async () => postRequestBody,
        writable: true,
      });
      await POST(postRequest);

      const request = new NextRequest(
        'http://localhost:3000/api/proposals?network=sepolia'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.proposals.length).toBeGreaterThan(0);
    });

    it('should filter proposals by status', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/proposals?status=pending'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      // Force an error by mocking searchParams to throw
      const request = new NextRequest('http://localhost:3000/api/proposals');

      // Mock searchParams.get to throw an error
      Object.defineProperty(request.nextUrl, 'searchParams', {
        get: () => {
          throw new Error('Mock error');
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should paginate results', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/proposals?limit=5&offset=0'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.proposals.length).toBeLessThanOrEqual(5);
    });

    it('should sort proposals by creation date (newest first)', async () => {
      // Use fake timers to control timestamps
      vi.useFakeTimers();

      // Create multiple proposals with different timestamps
      const createProposal = async (contractName: string) => {
        const requestBody = {
          contractName,
          bytecode: '0x608060',
          network: 'sepolia',
        };
        const request = new NextRequest('http://localhost:3000/api/proposals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        Object.defineProperty(request, 'json', {
          value: async () => requestBody,
          writable: true,
        });
        await POST(request);
        // Advance time by 10ms to ensure different timestamps
        vi.advanceTimersByTime(10);
      };

      await createProposal('First');
      await createProposal('Second');
      await createProposal('Third');

      const request = new NextRequest('http://localhost:3000/api/proposals');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.proposals.length).toBeGreaterThanOrEqual(3);

      // Verify sorted by newest first
      const timestamps = data.proposals.map((p: any) =>
        new Date(p.createdAt).getTime()
      );
      for (let i = 0; i < timestamps.length - 1; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
      }

      // Restore real timers
      vi.useRealTimers();
    });

    it('should handle non-Error exceptions in GET', async () => {
      const request = new NextRequest('http://localhost:3000/api/proposals');

      // Mock searchParams.get to throw a non-Error object
      Object.defineProperty(request.nextUrl, 'searchParams', {
        get: () => {
          throw 'String error'; // Non-Error object
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unknown error');
    });
  });

  describe('POST /api/proposals', () => {
    it('should create a new proposal', async () => {
      const requestBody = {
        contractName: 'TestContract',
        bytecode: '0x608060405234801561001057600080fd5b50',
        network: 'sepolia',
        constructorArgs: [],
        value: '0',
      };

      // Create a Request with proper headers and body
      const request = new NextRequest('http://localhost:3000/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Mock the request.json() method
      Object.defineProperty(request, 'json', {
        value: async () => requestBody,
        writable: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.proposalId).toBeDefined();
      expect(data.proposal).toBeDefined();
      expect(data.validationHash).toBe('0xvalidationhash');
    });

    it('should return error for missing required fields', async () => {
      const requestBody = {
        contractName: 'TestContract',
        // Missing bytecode and network
      };

      const request = new NextRequest('http://localhost:3000/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      Object.defineProperty(request, 'json', {
        value: async () => requestBody,
        writable: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields');
    });

    it('should return error for unsupported network', async () => {
      const requestBody = {
        contractName: 'TestContract',
        bytecode: '0x608060',
        network: 'unsupported',
      };

      const request = new NextRequest('http://localhost:3000/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      Object.defineProperty(request, 'json', {
        value: async () => requestBody,
        writable: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unsupported network');
    });

    it('should include metadata in proposal', async () => {
      const requestBody = {
        contractName: 'TestContract',
        bytecode: '0x608060',
        network: 'sepolia',
        metadata: {
          description: 'Test deployment',
          requestor: 'test@example.com',
          jiraTicket: 'ZERO-123',
        },
      };

      // Create a Request with proper headers and body
      const request = new NextRequest('http://localhost:3000/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Mock the request.json() method
      Object.defineProperty(request, 'json', {
        value: async () => requestBody,
        writable: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it('should return error when proposal validation fails', async () => {
      const requestBody = {
        contractName: 'TestContract',
        bytecode: '0x608060',
        network: 'sepolia',
        metadata: {
          _forceInvalid: true, // Flag to force validation failure
        },
      };

      const request = new NextRequest('http://localhost:3000/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      Object.defineProperty(request, 'json', {
        value: async () => requestBody,
        writable: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Proposal validation failed');
    });

    it('should handle errors during proposal creation', async () => {
      const requestBody = {
        contractName: 'TestContract',
        bytecode: '0x608060',
        network: 'sepolia',
        metadata: {
          _throwError: true, // Flag to force error
        },
      };

      const request = new NextRequest('http://localhost:3000/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      Object.defineProperty(request, 'json', {
        value: async () => requestBody,
        writable: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle non-Error exceptions in POST', async () => {
      const request = new NextRequest('http://localhost:3000/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      // Mock request.json() to throw a non-Error object
      Object.defineProperty(request, 'json', {
        value: async () => {
          throw { message: 'Not an Error instance' }; // Non-Error object
        },
        writable: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unknown error');
    });
  });
});
