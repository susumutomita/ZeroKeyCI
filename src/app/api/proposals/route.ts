import { NextRequest, NextResponse } from 'next/server';
import { SafeProposalBuilder } from '@/services/SafeProposalBuilder';
import {
  CreateProposalRequest,
  CreateProposalResponse,
  GetProposalsResponse,
  ProposalWithMetadata,
  ProposalStatus,
} from '@/types/api';

// In-memory storage for demo (in production, use a database)
const proposals: ProposalWithMetadata[] = [];

/**
 * GET /api/proposals
 * Fetch all proposals with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const network = searchParams.get('network');
    const status = searchParams.get('status') as ProposalStatus | null;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Filter proposals
    let filtered = [...proposals];

    if (network) {
      filtered = filtered.filter((p) => p.network === network);
    }

    if (status) {
      filtered = filtered.filter((p) => p.status === status);
    }

    // Sort by creation date (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Paginate
    const paginated = filtered.slice(offset, offset + limit);

    const response: GetProposalsResponse = {
      success: true,
      proposals: paginated,
      total: filtered.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    const response: GetProposalsResponse = {
      success: false,
      proposals: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/proposals
 * Create a new Safe proposal
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateProposalRequest = await request.json();

    // Validate required fields
    if (!body.contractName || !body.bytecode || !body.network) {
      const response: CreateProposalResponse = {
        success: false,
        error: 'Missing required fields: contractName, bytecode, network',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Get Safe address from environment or use default for demo
    const safeAddress =
      process.env.SAFE_ADDRESS || '0x742D35CC6634c0532925A3b844BC9E7595F0BEb0';

    // Get chain ID based on network
    const chainIds: Record<string, number> = {
      sepolia: 11155111,
      mainnet: 1,
      polygon: 137,
      arbitrum: 42161,
      optimism: 10,
      base: 8453,
    };

    const chainId = chainIds[body.network];
    if (!chainId) {
      const response: CreateProposalResponse = {
        success: false,
        error: `Unsupported network: ${body.network}`,
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Create SafeProposalBuilder instance
    const builder = new SafeProposalBuilder({
      safeAddress,
      chainId,
      defaultGasSettings: {
        safeTxGas: '5000000',
        gasPrice: '20000000000',
      },
    });

    // Create deployment proposal
    const proposal = await builder.createDeploymentProposal({
      contractName: body.contractName,
      bytecode: body.bytecode,
      constructorArgs: body.constructorArgs || [],
      value: body.value || '0',
      metadata: {
        ...body.metadata,
        timestamp: Date.now(),
        network: body.network,
      },
    });

    // Validate the proposal
    const isValid = builder.validateProposal(proposal);
    if (!isValid) {
      const response: CreateProposalResponse = {
        success: false,
        error: 'Proposal validation failed',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Generate validation hash
    const validationHash = builder.generateValidationHash(proposal);

    // Create proposal with metadata
    const proposalId = `prop_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const proposalWithMetadata: ProposalWithMetadata = {
      id: proposalId,
      proposal,
      safeAddress,
      chainId,
      network: body.network,
      contractName: body.contractName,
      validationHash,
      status: ProposalStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: body.metadata,
    };

    // Store proposal (in production, save to database)
    proposals.push(proposalWithMetadata);

    const response: CreateProposalResponse = {
      success: true,
      proposalId,
      proposal,
      safeAddress,
      validationHash,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const response: CreateProposalResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
