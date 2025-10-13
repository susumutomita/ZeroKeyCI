import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import RootLayout, { metadata } from '../layout';

// Mock Next.js font optimization
vi.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-font-mock',
  }),
}));

describe('RootLayout', () => {
  it('should render children correctly', () => {
    const { container } = render(
      <RootLayout>
        <div data-testid="test-child">Test Content</div>
      </RootLayout>
    );

    const child = container.querySelector('[data-testid="test-child"]');
    expect(child).toBeInTheDocument();
    expect(child).toHaveTextContent('Test Content');
  });

  it('should have correct html and body structure', () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );

    const html = container.querySelector('html');
    const body = container.querySelector('body');

    expect(html).toBeInTheDocument();
    expect(html).toHaveAttribute('lang', 'en');
    expect(body).toBeInTheDocument();
    expect(body).toHaveClass('inter-font-mock');
  });

  it('should apply global styles', () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );

    // Check that body has the font class applied
    const body = container.querySelector('body');
    expect(body?.className).toContain('inter-font-mock');
  });
});

describe('metadata', () => {
  it('should have correct title', () => {
    expect(metadata.title).toBe('ZeroKeyCI');
  });

  it('should have correct description', () => {
    expect(metadata.description).toBe('Zero-knowledge CI/CD system');
  });
});
