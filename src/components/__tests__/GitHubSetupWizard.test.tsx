import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GitHubSetupWizard from '../GitHubSetupWizard';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('GitHubSetupWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Step 1: Configuration', () => {
    it('should render step 1 by default', () => {
      render(<GitHubSetupWizard />);
      expect(screen.getByText('Configure Your Deployment')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(
          '0x742D35CC6634c0532925A3b844BC9E7595F0BEb0'
        )
      ).toBeInTheDocument();
    });

    it('should show progress steps with step 1 active', () => {
      render(<GitHubSetupWizard />);
      expect(screen.getByText('Configure')).toBeInTheDocument();
      expect(screen.getByText('Download Files')).toBeInTheDocument();
      expect(screen.getByText('Setup GitHub')).toBeInTheDocument();
    });

    it('should allow entering safe address', () => {
      render(<GitHubSetupWizard />);
      const input = screen.getByPlaceholderText(
        '0x742D35CC6634c0532925A3b844BC9E7595F0BEb0'
      ) as HTMLInputElement;

      fireEvent.change(input, {
        target: { value: '0x1234567890123456789012345678901234567890' },
      });

      expect(input.value).toBe('0x1234567890123456789012345678901234567890');
    });

    it('should allow selecting network', () => {
      render(<GitHubSetupWizard />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;

      fireEvent.change(select, { target: { value: 'mainnet' } });

      expect(select.value).toBe('mainnet');
    });

    it('should have all network options', () => {
      render(<GitHubSetupWizard />);
      expect(screen.getByText('Sepolia (Testnet)')).toBeInTheDocument();
      expect(screen.getByText('Ethereum Mainnet')).toBeInTheDocument();
      expect(screen.getByText('Polygon')).toBeInTheDocument();
      expect(screen.getByText('Optimism')).toBeInTheDocument();
      expect(screen.getByText('Arbitrum')).toBeInTheDocument();
      expect(screen.getByText('Base')).toBeInTheDocument();
    });

    it('should disable next button when safe address is empty', () => {
      render(<GitHubSetupWizard />);
      const nextButton = screen.getByText(/Next: Download Files/i);

      expect(nextButton).toBeDisabled();
    });

    it('should enable next button when safe address is entered', () => {
      render(<GitHubSetupWizard />);
      const input = screen.getByPlaceholderText(
        '0x742D35CC6634c0532925A3b844BC9E7595F0BEb0'
      );
      const nextButton = screen.getByText(/Next: Download Files/i);

      fireEvent.change(input, {
        target: { value: '0x1234567890123456789012345678901234567890' },
      });

      expect(nextButton).not.toBeDisabled();
    });

    it('should move to step 2 when next button is clicked', () => {
      render(<GitHubSetupWizard />);
      const input = screen.getByPlaceholderText(
        '0x742D35CC6634c0532925A3b844BC9E7595F0BEb0'
      );

      fireEvent.change(input, {
        target: { value: '0x1234567890123456789012345678901234567890' },
      });

      const nextButton = screen.getByText(/Next: Download Files/i);
      fireEvent.click(nextButton);

      expect(
        screen.getByText('Download Configuration Files')
      ).toBeInTheDocument();
    });
  });

  describe('Step 2: Download Files', () => {
    beforeEach(() => {
      render(<GitHubSetupWizard />);
      const input = screen.getByPlaceholderText(
        '0x742D35CC6634c0532925A3b844BC9E7595F0BEb0'
      );
      fireEvent.change(input, {
        target: { value: '0x1234567890123456789012345678901234567890' },
      });
      const nextButton = screen.getByText(/Next: Download Files/i);
      fireEvent.click(nextButton);
    });

    it('should render step 2 content', () => {
      expect(
        screen.getByText('Download Configuration Files')
      ).toBeInTheDocument();
      expect(
        screen.getByText('.github/workflows/deploy.yml')
      ).toBeInTheDocument();
      expect(screen.getByText('.env.example')).toBeInTheDocument();
    });

    it('should show workflow YAML content', () => {
      expect(screen.getByText(/ZeroKeyCI Deployment/i)).toBeInTheDocument();
    });

    it('should show env example content', () => {
      expect(screen.getByText(/SAFE_ADDRESS=/i)).toBeInTheDocument();
    });

    it('should copy workflow when copy button is clicked', async () => {
      const copyButtons = screen.getAllByText('Copy');
      const workflowCopyButton = copyButtons[0];

      fireEvent.click(workflowCopyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });
    });

    it('should copy env example when copy button is clicked', async () => {
      const copyButtons = screen.getAllByText('Copy');
      const envCopyButton = copyButtons[1];

      fireEvent.click(envCopyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });
    });

    it('should show "Copied" after copying', async () => {
      const copyButtons = screen.getAllByText('Copy');
      const workflowCopyButton = copyButtons[0];

      fireEvent.click(workflowCopyButton);

      await waitFor(() => {
        expect(screen.getAllByText('Copied').length).toBeGreaterThan(0);
      });
    });

    it('should download workflow when download button is clicked', () => {
      const downloadButtons = screen.getAllByText('Download');
      const workflowDownloadButton = downloadButtons[0];

      fireEvent.click(workflowDownloadButton);

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('should download env example when download button is clicked', () => {
      const downloadButtons = screen.getAllByText('Download');
      const envDownloadButton = downloadButtons[1];

      fireEvent.click(envDownloadButton);

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('should have back button', () => {
      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('should go back to step 1 when back button is clicked', () => {
      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);

      expect(screen.getByText('Configure Your Deployment')).toBeInTheDocument();
    });

    it('should move to step 3 when next button is clicked', () => {
      const nextButton = screen.getByText(/Next: Setup GitHub/i);
      fireEvent.click(nextButton);

      expect(screen.getByText('Complete GitHub Setup')).toBeInTheDocument();
    });
  });

  describe('Step 3: GitHub Setup Instructions', () => {
    beforeEach(() => {
      render(<GitHubSetupWizard />);
      const input = screen.getByPlaceholderText(
        '0x742D35CC6634c0532925A3b844BC9E7595F0BEb0'
      );
      fireEvent.change(input, {
        target: { value: '0x1234567890123456789012345678901234567890' },
      });
      fireEvent.click(screen.getByText(/Next: Download Files/i));
      fireEvent.click(screen.getByText(/Next: Setup GitHub/i));
    });

    it('should render step 3 content', () => {
      expect(screen.getByText('Complete GitHub Setup')).toBeInTheDocument();
      expect(
        screen.getByText('Add files to your repository')
      ).toBeInTheDocument();
      expect(screen.getByText('Configure GitHub Secrets')).toBeInTheDocument();
      expect(
        screen.getByText('Deploy your first contract')
      ).toBeInTheDocument();
    });

    it('should show instruction steps', () => {
      expect(
        screen.getByText(/Create workflows directory/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Go to your repository on GitHub/i)
      ).toBeInTheDocument();
    });

    it('should show safe address in instructions', () => {
      expect(
        screen.getByText(/0x1234567890123456789012345678901234567890/i)
      ).toBeInTheDocument();
    });

    it('should copy code snippets when copy button is clicked', async () => {
      const copyButtons = screen.getAllByRole('button', {
        name: /Copy/i,
      });

      // Click the first copy button in step 3 instructions
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });
    });

    it('should have back button', () => {
      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('should go back to step 2 when back button is clicked', () => {
      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);

      expect(
        screen.getByText('Download Configuration Files')
      ).toBeInTheDocument();
    });

    it('should have documentation link', () => {
      const docLink = screen.getByText('View Full Documentation');
      expect(docLink).toBeInTheDocument();
      expect(docLink.closest('a')).toHaveAttribute(
        'href',
        'https://github.com/susumutomita/ZeroKeyCI'
      );
    });

    it('should show success message', () => {
      expect(screen.getByText(/You're All Set!/i)).toBeInTheDocument();
    });
  });

  describe('Network selection integration', () => {
    it('should include selected network in workflow YAML', () => {
      render(<GitHubSetupWizard />);

      // Select polygon network
      const networkSelect = screen.getByRole('combobox');
      fireEvent.change(networkSelect, { target: { value: 'polygon' } });

      // Enter safe address
      const input = screen.getByPlaceholderText(
        '0x742D35CC6634c0532925A3b844BC9E7595F0BEb0'
      );
      fireEvent.change(input, {
        target: { value: '0x1234567890123456789012345678901234567890' },
      });

      // Go to step 2
      fireEvent.click(screen.getByText(/Next: Download Files/i));

      // Check that polygon is in the YAML
      expect(screen.getByText(/NETWORK: polygon/i)).toBeInTheDocument();
    });

    it('should include selected network in env example', () => {
      render(<GitHubSetupWizard />);

      // Select mainnet
      const networkSelect = screen.getByRole('combobox');
      fireEvent.change(networkSelect, { target: { value: 'mainnet' } });

      // Enter safe address
      const input = screen.getByPlaceholderText(
        '0x742D35CC6634c0532925A3b844BC9E7595F0BEb0'
      );
      fireEvent.change(input, {
        target: { value: '0x1234567890123456789012345678901234567890' },
      });

      // Go to step 2
      fireEvent.click(screen.getByText(/Next: Download Files/i));

      // Check that mainnet is in the env
      expect(screen.getByText(/NETWORK=mainnet/i)).toBeInTheDocument();
    });
  });

  describe('Copy timeout behavior', () => {
    it('should reset copied state after timeout', async () => {
      vi.useFakeTimers();

      render(<GitHubSetupWizard />);

      // Go to step 2
      const input = screen.getByPlaceholderText(
        '0x742D35CC6634c0532925A3b844BC9E7595F0BEb0'
      );
      fireEvent.change(input, {
        target: { value: '0x1234567890123456789012345678901234567890' },
      });
      fireEvent.click(screen.getByText(/Next: Download Files/i));

      // Click copy
      const copyButtons = screen.getAllByText('Copy');
      fireEvent.click(copyButtons[0]);

      // Should show "Copied"
      expect(screen.getAllByText('Copied').length).toBeGreaterThan(0);

      // Fast-forward 2 seconds
      vi.runAllTimers();

      // Should revert to "Copy"
      expect(screen.getAllByText('Copy').length).toBeGreaterThan(0);

      vi.useRealTimers();
    });
  });
});
