import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Home from '../page';

describe('Landing Page', () => {
  it('should render the hero section', () => {
    render(<Home />);
    expect(screen.getByText('ZeroKeyCI')).toBeInTheDocument();
    expect(
      screen.getByText('Deploy Smart Contracts Without Private Keys in CI/CD')
    ).toBeInTheDocument();
  });

  it('should render the get started button', () => {
    render(<Home />);
    const getStartedButton = screen.getByText('Get Started');
    expect(getStartedButton).toBeInTheDocument();
    expect(getStartedButton).toHaveAttribute('href', '#getting-started');
  });

  it('should render the GitHub link', () => {
    render(<Home />);
    const githubLink = screen.getByText('View on GitHub');
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/susumutomita/ZeroKeyCI'
    );
  });

  it('should render the How It Works section', () => {
    render(<Home />);
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('Create PR')).toBeInTheDocument();
    expect(screen.getByText('CI Generates Proposal')).toBeInTheDocument();
    expect(screen.getByText('Review & Sign')).toBeInTheDocument();
    expect(screen.getByText('Deploy')).toBeInTheDocument();
  });

  it('should render all key features', () => {
    render(<Home />);
    expect(screen.getByText('Key Features')).toBeInTheDocument();
    expect(screen.getByText('No Private Keys in CI')).toBeInTheDocument();
    expect(screen.getByText('Policy Validation')).toBeInTheDocument();
    expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    expect(screen.getByText('UUPS Upgradeable')).toBeInTheDocument();
    expect(screen.getByText('Deterministic Addresses')).toBeInTheDocument();
    expect(screen.getByText('100% Test Coverage')).toBeInTheDocument();
  });

  it('should render Getting Started section with tabs', () => {
    render(<Home />);
    expect(screen.getByText('Getting Started')).toBeInTheDocument();

    // Check that all tabs are present
    const overviewButton = screen.getByRole('button', { name: /overview/i });
    const setupButton = screen.getByRole('button', { name: /setup/i });
    const deployButton = screen.getByRole('button', { name: /deploy/i });
    const testButton = screen.getByRole('button', { name: /test/i });

    expect(overviewButton).toBeInTheDocument();
    expect(setupButton).toBeInTheDocument();
    expect(deployButton).toBeInTheDocument();
    expect(testButton).toBeInTheDocument();
  });

  it('should switch tabs when clicked', () => {
    render(<Home />);

    // Initially overview tab should be active
    expect(
      screen.getByText('Overview', { selector: 'h3' })
    ).toBeInTheDocument();

    // Click setup tab
    const setupButton = screen.getByRole('button', { name: /setup/i });
    fireEvent.click(setupButton);
    expect(screen.getByText('Initial Setup')).toBeInTheDocument();

    // Click deploy tab
    const deployButton = screen.getByRole('button', { name: /deploy/i });
    fireEvent.click(deployButton);
    expect(screen.getByText('Deployment Process')).toBeInTheDocument();

    // Click test tab
    const testButton = screen.getByRole('button', { name: /test/i });
    fireEvent.click(testButton);
    expect(screen.getByText('Local Testing')).toBeInTheDocument();
  });

  it('should render the system architecture section', () => {
    render(<Home />);
    expect(screen.getByText('System Architecture')).toBeInTheDocument();

    // Architecture diagram contains these terms
    const architectureDiagram = screen.getByText(/Developer.*GitHub.*CI\/CD/s);
    expect(architectureDiagram).toBeInTheDocument();
    expect(architectureDiagram.textContent).toContain('SafeProposal');
    expect(architectureDiagram.textContent).toContain('Gnosis Safe');
  });

  it('should render the footer with links', () => {
    render(<Home />);
    const footerText = screen.getByText(
      'Built with security and simplicity in mind'
    );
    expect(footerText).toBeInTheDocument();

    // Check footer links
    const githubLinks = screen.getAllByText('GitHub');
    expect(githubLinks.length).toBeGreaterThan(0);

    const docsLink = screen.getByText('Documentation');
    expect(docsLink).toBeInTheDocument();
    expect(docsLink).toHaveAttribute('href', '/docs');

    const issuesLink = screen.getByText('Issues');
    expect(issuesLink).toBeInTheDocument();
    expect(issuesLink).toHaveAttribute(
      'href',
      'https://github.com/susumutomita/ZeroKeyCI/issues'
    );
  });

  it('should show code examples in setup tab', () => {
    render(<Home />);
    const setupButton = screen.getByRole('button', { name: /setup/i });
    fireEvent.click(setupButton);

    // Check for configuration examples
    expect(
      screen.getByText(
        /SAFE_ADDRESS=0x742D35CC6634c0532925A3b844BC9E7595F0BEb0/
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/network: sepolia/)).toBeInTheDocument();
    expect(screen.getByText(/package deployment/)).toBeInTheDocument();
  });

  it('should show deployment instructions in deploy tab', () => {
    render(<Home />);
    const deployButton = screen.getByRole('button', { name: /deploy/i });
    fireEvent.click(deployButton);

    // Check for deployment instructions
    expect(screen.getByText(/pragma solidity/)).toBeInTheDocument();
    expect(
      screen.getByText(/git checkout -b feat\/deploy-contract/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Compile your contracts/)).toBeInTheDocument();
  });

  it('should show test commands in test tab', () => {
    render(<Home />);
    const testButton = screen.getByRole('button', { name: /test/i });
    fireEvent.click(testButton);

    // Check for test commands
    expect(
      screen.getByText(/bun run scripts\/test-local-deployment.ts/)
    ).toBeInTheDocument();
    expect(screen.getByText(/bun run test:coverage/)).toBeInTheDocument();
    expect(screen.getByText(/make before_commit/)).toBeInTheDocument();
  });
});
