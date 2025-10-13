import { NextRequest, NextResponse } from 'next/server';
import {
  ProposalWithMetadata,
  UpdateProposalStatusRequest,
  UpdateProposalStatusResponse,
} from '@/types/api';

// This would be shared with the main route in production (use a database)
// For demo purposes, we'll use a simple in-memory store
const getProposalStore = (): ProposalWithMetadata[] => {
  if (!global.proposals) {
    global.proposals = [];
  }
  return global.proposals;
};

/**
 * GET /api/proposals/[id]
 * Get a specific proposal by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proposals = getProposalStore();
    const proposal = proposals.find((p) => p.id === params.id);

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: 'Proposal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, proposal });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/proposals/[id]
 * Update proposal status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: Partial<UpdateProposalStatusRequest> = await request.json();
    const proposals = getProposalStore();
    const proposalIndex = proposals.findIndex((p) => p.id === params.id);

    if (proposalIndex === -1) {
      const response: UpdateProposalStatusResponse = {
        success: false,
        error: 'Proposal not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Update proposal
    const proposal = proposals[proposalIndex];
    if (body.status) {
      proposal.status = body.status;
    }
    proposal.updatedAt = new Date().toISOString();

    // Store transaction hash if provided
    if (body.txHash) {
      proposal.metadata = {
        ...proposal.metadata,
        txHash: body.txHash,
      };
    }

    // Store error if provided
    if (body.error) {
      proposal.metadata = {
        ...proposal.metadata,
        error: body.error,
      };
    }

    const response: UpdateProposalStatusResponse = {
      success: true,
      proposal,
    };

    return NextResponse.json(response);
  } catch (error) {
    const response: UpdateProposalStatusResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/proposals/[id]
 * Delete a proposal (only if pending)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proposals = getProposalStore();
    const proposalIndex = proposals.findIndex((p) => p.id === params.id);

    if (proposalIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Proposal not found' },
        { status: 404 }
      );
    }

    const proposal = proposals[proposalIndex];

    // Only allow deletion of pending proposals
    if (proposal.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete proposal with status: ${proposal.status}`,
        },
        { status: 400 }
      );
    }

    // Remove proposal
    proposals.splice(proposalIndex, 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Declare global type for proposals storage
declare global {
  // eslint-disable-next-line no-var
  var proposals: ProposalWithMetadata[] | undefined;
}
