import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../page';

describe('Home page', () => {
  it('should render the heading', () => {
    render(<Home />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('ZeroKeyCI');
  });

  it('should render the tagline', () => {
    render(<Home />);
    const tagline = screen.getByText(
      'Deploy Smart Contracts Without Private Keys in CI/CD'
    );
    expect(tagline).toBeInTheDocument();
  });

  it('should have proper structure', () => {
    const { container } = render(<Home />);

    // Check for main container
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('min-h-screen');
  });

  it('should render call-to-action buttons', () => {
    render(<Home />);

    const getStartedButton = screen.getByText('Get Started');
    const githubButton = screen.getByText('View on GitHub');

    expect(getStartedButton).toBeInTheDocument();
    expect(githubButton).toBeInTheDocument();
  });
});
