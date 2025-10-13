import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../page';

describe('Home page', () => {
  it('should render the heading', () => {
    render(<Home />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Welcome to ZeroKeyCI');
  });

  it('should render the description', () => {
    render(<Home />);
    const description = screen.getByText(/Zero-knowledge CI\/CD system/i);
    expect(description).toBeInTheDocument();
  });

  it('should have proper structure', () => {
    const { container } = render(<Home />);

    // Check for main container
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('flex');
    expect(main).toHaveClass('min-h-screen');
    expect(main).toHaveClass('flex-col');
    expect(main).toHaveClass('items-center');
    expect(main).toHaveClass('justify-center');
    expect(main).toHaveClass('p-24');
  });

  it('should have proper content wrapper', () => {
    const { container } = render(<Home />);

    // Check for content wrapper div
    const wrapper = container.querySelector('.font-mono');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass('z-10');
    expect(wrapper).toHaveClass('max-w-5xl');
    expect(wrapper).toHaveClass('w-full');
    expect(wrapper).toHaveClass('items-center');
    expect(wrapper).toHaveClass('justify-center');
    expect(wrapper).toHaveClass('font-mono');
    expect(wrapper).toHaveClass('text-sm');
  });
});
