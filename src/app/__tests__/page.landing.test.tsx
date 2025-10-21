import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Home from '../page';

describe('Landing Page', () => {
  it('should render the hero section', () => {
    render(<Home />);
    expect(
      screen.getByText('Secure Smart Contract Deployment')
    ).toBeInTheDocument();
    // Check for the full hero heading instead of partial text
    expect(
      screen.getByRole('heading', { level: 1, name: /Deploy Contracts/i })
    ).toBeInTheDocument();
  });

  it('should render the get started button', () => {
    render(<Home />);
    const getStartedButton = screen.getByText(/Get Started in 3 Minutes/i);
    expect(getStartedButton).toBeInTheDocument();
    expect(getStartedButton).toHaveAttribute('href', '#setup');
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

  it('should render key benefit cards', () => {
    render(<Home />);
    const multiSigCards = screen.getAllByText('Multi-Signature Security');
    expect(multiSigCards.length).toBeGreaterThan(0);
    const auditCards = screen.getAllByText('Complete Audit Trail');
    expect(auditCards.length).toBeGreaterThan(0);
    expect(screen.getByText('Policy Enforcement')).toBeInTheDocument();
  });

  it('should render the solution section', () => {
    render(<Home />);
    expect(screen.getByText('The Solution')).toBeInTheDocument();
    const zerokeyElements = screen.getAllByText(/ZeroKeyCI/i);
    expect(zerokeyElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/Zero Private Keys in CI/i)).toBeInTheDocument();
  });

  it('should render How It Actually Works section', () => {
    render(<Home />);
    // Check for specific step content in the workflow instead of the title
    expect(screen.getByText(/Developer Creates PR/i)).toBeInTheDocument();
    expect(
      screen.getByText(/GitHub Actions Compiles & Validates/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Generates Safe Transaction Proposal/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Safe Owners Review & Sign/i)).toBeInTheDocument();
    expect(screen.getByText(/Deployed to Blockchain/i)).toBeInTheDocument();
  });

  it('should render Try It Right Now section', () => {
    render(<Home />);
    // Check for the demo sandbox content
    expect(
      screen.getByText(
        /See how ZeroKeyCI creates deployment transactions without private keys/i
      )
    ).toBeInTheDocument();
  });

  it('should render Deploy Your First Contract section', () => {
    render(<Home />);
    expect(screen.getByText('3-Minute Setup')).toBeInTheDocument();
    expect(screen.getByText(/Deploy Your First Contract/i)).toBeInTheDocument();
    const in3MinutesElements = screen.getAllByText(/In 3 Minutes/i);
    expect(in3MinutesElements.length).toBeGreaterThan(0);
  });

  it('should render Why This Matters section with tabs', () => {
    render(<Home />);
    expect(screen.getByText('Why This Matters')).toBeInTheDocument();

    // Check that all tabs are present
    const problemButton = screen.getByRole('button', { name: /problem/i });
    const traditionalButton = screen.getByRole('button', {
      name: /traditional/i,
    });
    const zerokeyButton = screen.getByRole('button', {
      name: /With ZeroKeyCI/i,
    });

    expect(problemButton).toBeInTheDocument();
    expect(traditionalButton).toBeInTheDocument();
    expect(zerokeyButton).toBeInTheDocument();
  });

  it('should switch tabs when clicked', () => {
    render(<Home />);

    // Initially problem tab should be active
    expect(
      screen.getByText('Traditional Approach: Challenges')
    ).toBeInTheDocument();

    // Click traditional tab
    const traditionalButton = screen.getByRole('button', {
      name: /traditional/i,
    });
    fireEvent.click(traditionalButton);
    expect(
      screen.getByText('Traditional Solution: Manual Deployments')
    ).toBeInTheDocument();

    // Click zerokey tab
    const zerokeyButton = screen.getByRole('button', {
      name: /With ZeroKeyCI/i,
    });
    fireEvent.click(zerokeyButton);
    expect(
      screen.getByText('ZeroKeyCI: Security + Automation')
    ).toBeInTheDocument();
  });

  it('should render the footer with correct text', () => {
    render(<Home />);
    const footerText = screen.getByText(
      'Built with security and developer experience in mind'
    );
    expect(footerText).toBeInTheDocument();

    // Check footer links
    const githubLinks = screen.getAllByText('GitHub');
    expect(githubLinks.length).toBeGreaterThan(0);

    const docsLink = screen.getByText('Documentation');
    expect(docsLink).toBeInTheDocument();
    expect(docsLink).toHaveAttribute(
      'href',
      'https://github.com/susumutomita/ZeroKeyCI/blob/main/docs/PRODUCTION-SETUP.md'
    );

    const issuesLink = screen.getByText('Issues');
    expect(issuesLink).toBeInTheDocument();
    expect(issuesLink).toHaveAttribute(
      'href',
      'https://github.com/susumutomita/ZeroKeyCI/issues'
    );
  });

  it('should have Liquid Glass design with translucent effects and blue accents', () => {
    const { container } = render(<Home />);

    // Check for Liquid Glass design elements (glass-card, glass-strong)
    const glassElements = container.querySelectorAll(
      '[class*="glass-card"], [class*="glass-strong"], [class*="glass"]'
    );
    expect(glassElements.length).toBeGreaterThan(0);

    // Check for blue accent elements (maintained from previous design)
    const blueAccentElements = container.querySelectorAll(
      '[class*="blue-600"], [class*="blue-50"], [class*="blue-400"], [class*="blue-500"]'
    );
    expect(blueAccentElements.length).toBeGreaterThan(0);
  });

  it('should show educational tone in problem tab', () => {
    render(<Home />);

    // The problem tab should use educational language
    expect(
      screen.getByText('Traditional Approach: Challenges')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Common patterns in Web3 CI\/CD/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Industry best practice: Multi-signature wallets provide enhanced security/i
      )
    ).toBeInTheDocument();
  });

  it('should render Lit Protocol Technical Deep Dive section', () => {
    render(<Home />);

    // Check for Lit Protocol section headings using getAllByText for duplicate content
    const litProtocolHeadings = screen.getAllByText(
      /How Lit Protocol Powers Keyless CI\/CD/i
    );
    expect(litProtocolHeadings.length).toBeGreaterThan(0);

    const pkpArchHeadings = screen.getAllByText(/PKP Architecture/i);
    expect(pkpArchHeadings.length).toBeGreaterThan(0);

    // Check for unique content within the section
    expect(
      screen.getByText(
        /threshold cryptography across its decentralized network/i
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/Security Guarantees/i)).toBeInTheDocument();
    expect(screen.getByText(/No Private Key Exposure/i)).toBeInTheDocument();
    expect(screen.getByText(/Conditional Signing Only/i)).toBeInTheDocument();
  });
});
