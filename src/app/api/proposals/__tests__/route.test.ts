import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock the SafeProposalBuilder
vi.mock('@/services/SafeProposalBuilder', () => ({
  SafeProposalBuilder: vi.fn().mockImplementation(() => ({
    createDeploymentProposal: vi.fn().mockResolvedValue({
      to: '0x0000000000000000000000000000000000000000',
      value: '0',
      data: '0x608060',
      operation: 0,
      gasLimit: 5000000,
    }),
    validateProposal: vi.fn().mockReturnValue(true),
    generateValidationHash: vi.fn().mockReturnValue('0xvalidationhash'),
  })),
}));

describe('API /api/proposals', () => {
  beforeEach(() => {
    // Reset global proposals storage
    global.proposals = [];
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
      const request = new NextRequest(
        'http://localhost:3000/api/proposals?network=sepolia'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
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

      const request = new NextRequest('http://localhost:3000/api/proposals', {
        method: 'POST',
        body: JSON.stringify(requestBody),
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
        body: JSON.stringify(requestBody),
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
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unsupported network');
    });

    it('should handle proposal validation failure', async () => {
      // Mock validation to return false
      const SafeProposalBuilder = vi.requireMock(
        '@/services/SafeProposalBuilder'
      ).SafeProposalBuilder;
      SafeProposalBuilder.mockImplementationOnce(() => ({
        createDeploymentProposal: vi.fn().mockResolvedValue({
          to: '0x0000000000000000000000000000000000000000',
          value: '0',
          data: '0x608060',
          operation: 0,
        }),
        validateProposal: vi.fn().mockReturnValue(false), // Validation fails
        generateValidationHash: vi.fn(),
      }));

      const requestBody = {
        contractName: 'TestContract',
        bytecode: '0x608060',
        network: 'sepolia',
      };

      const request = new NextRequest('http://localhost:3000/api/proposals', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Proposal validation failed');
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

      const request = new NextRequest('http://localhost:3000/api/proposals', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });
  });
});
