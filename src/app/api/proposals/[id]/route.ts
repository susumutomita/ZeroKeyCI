import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/services/ProposalStorage';
import {
  ProposalWithMetadata,
  UpdateProposalStatusRequest,
  UpdateProposalStatusResponse,
} from '@/types/api';

/**
 * GET /api/proposals/[id]
 * Get a specific proposal by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storage = getStorage();
    const proposal = await storage.getById(params.id);

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
    const storage = getStorage();
    const proposal = await storage.getById(params.id);

    if (!proposal) {
      const response: UpdateProposalStatusResponse = {
        success: false,
        error: 'Proposal not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Update proposal
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

    // Save updated proposal
    await storage.update(params.id, proposal);

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
    const storage = getStorage();
    const proposal = await storage.getById(params.id);

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: 'Proposal not found' },
        { status: 404 }
      );
    }

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

    // Remove proposal from storage
    await storage.delete(params.id);

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
