import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SafeProposalSandbox from '../SafeProposalSandbox';

// Mock the SafeProposalBuilder
vi.mock('@/services/SafeProposalBuilder', () => ({
  SafeProposalBuilder: vi.fn().mockImplementation(() => ({
    createDeploymentProposal: vi.fn().mockResolvedValue({
      to: '0x0000000000000000000000000000000000000000',
      value: '0',
      data: '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe',
      operation: 0,
      gasLimit: 5000000,
    }),
    validateProposal: vi.fn().mockReturnValue(true),
    generateValidationHash: vi.fn().mockReturnValue('0xmockhash123'),
    calculateDeploymentAddress: vi
      .fn()
      .mockReturnValue('0x7b9244DBD2Bb84C57a8e5C4b8135d412bFE8f1b7'),
  })),
}));

describe('SafeProposalSandbox', () => {
  it('should render the sandbox title', () => {
    render(<SafeProposalSandbox />);
    expect(
      screen.getByText('Try It Live - Safe Proposal Sandbox')
    ).toBeInTheDocument();
  });

  it('should render all tabs', () => {
    render(<SafeProposalSandbox />);
    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(screen.getByText('Contract Code')).toBeInTheDocument();
    expect(screen.getByText('Generated Proposal')).toBeInTheDocument();
  });

  it('should show configuration tab by default', () => {
    render(<SafeProposalSandbox />);
    expect(screen.getByLabelText('Contract Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Network')).toBeInTheDocument();
    expect(screen.getByLabelText('Safe Address')).toBeInTheDocument();
  });

  it('should switch tabs when clicked', () => {
    render(<SafeProposalSandbox />);

    // Click Contract Code tab
    fireEvent.click(screen.getByText('Contract Code'));
    expect(screen.getByText(/pragma solidity \^0\.8\.20/)).toBeInTheDocument();

    // Click Generated Proposal tab
    fireEvent.click(screen.getByText('Generated Proposal'));
    expect(
      screen.getByText(
        /Configure your deployment and click "Generate Safe Proposal"/
      )
    ).toBeInTheDocument();
  });

  it('should update contract name input', () => {
    render(<SafeProposalSandbox />);
    const input = screen.getByLabelText('Contract Name') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'TestContract' } });
    expect(input.value).toBe('TestContract');
  });

  it('should update network selection', () => {
    render(<SafeProposalSandbox />);
    const select = screen.getByLabelText('Network') as HTMLSelectElement;

    fireEvent.change(select, { target: { value: 'mainnet' } });
    expect(select.value).toBe('mainnet');
  });

  it('should generate proposal when button is clicked', async () => {
    render(<SafeProposalSandbox />);

    const button = screen.getByText('Generate Safe Proposal');
    fireEvent.click(button);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Generated Proposal'));
      expect(
        screen.getByText('✅ Proposal Generated Successfully')
      ).toBeInTheDocument();
    });
  });

  it('should display validation hash after generating proposal', async () => {
    render(<SafeProposalSandbox />);

    const button = screen.getByText('Generate Safe Proposal');
    fireEvent.click(button);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Generated Proposal'));
      expect(screen.getByText('0xmockhash123')).toBeInTheDocument();
    });
  });

  it('should display deployment address after generating proposal', async () => {
    render(<SafeProposalSandbox />);

    const button = screen.getByText('Generate Safe Proposal');
    fireEvent.click(button);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Generated Proposal'));
      expect(
        screen.getByText('0x7b9244DBD2Bb84C57a8e5C4b8135d412bFE8f1b7')
      ).toBeInTheDocument();
    });
  });

  it('should handle invalid constructor args JSON', async () => {
    render(<SafeProposalSandbox />);

    const input = screen.getByLabelText(
      'Constructor Args (JSON)'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'invalid json' } });

    const button = screen.getByText('Generate Safe Proposal');
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText(/Invalid constructor arguments JSON/)
      ).toBeInTheDocument();
    });
  });

  it('should show sample contract code in code tab', () => {
    render(<SafeProposalSandbox />);

    fireEvent.click(screen.getByText('Contract Code'));

    expect(screen.getByText(/contract MyContract/)).toBeInTheDocument();
    expect(screen.getByText(/UUPSUpgradeable/)).toBeInTheDocument();
    expect(screen.getByText(/function initialize/)).toBeInTheDocument();
  });

  it('should display transaction details after proposal generation', async () => {
    render(<SafeProposalSandbox />);

    const button = screen.getByText('Generate Safe Proposal');
    fireEvent.click(button);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Generated Proposal'));
      expect(screen.getByText('Transaction Type')).toBeInTheDocument();
      expect(screen.getByText('CREATE')).toBeInTheDocument();
      expect(screen.getByText('Gas Limit')).toBeInTheDocument();
    });
  });
});
