import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CodeSnippet } from '../CodeSnippet';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('CodeSnippet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render code snippet with default language', () => {
      render(<CodeSnippet code="console.log('hello')" />);

      const codeElement = screen.getByText("console.log('hello')");
      expect(codeElement).toBeTruthy();
      expect(codeElement.className).toContain('language-bash');
    });

    it('should render code snippet with custom language', () => {
      render(<CodeSnippet code="const x = 1;" language="typescript" />);

      const codeElement = screen.getByText('const x = 1;');
      expect(codeElement).toBeTruthy();
      expect(codeElement.className).toContain('language-typescript');
    });

    it('should render title when provided', () => {
      render(<CodeSnippet code="npm install" title="Installation Command" />);

      expect(screen.getByText('Installation Command')).toBeTruthy();
    });

    it('should not render title when not provided', () => {
      const { container } = render(<CodeSnippet code="npm install" />);

      const titleElement = container.querySelector(
        '.text-sm.font-medium.text-gray-400'
      );
      expect(titleElement).toBeNull();
    });

    it('should render copy button', () => {
      render(<CodeSnippet code="test code" />);

      const copyButton = screen.getByRole('button', {
        name: /copy to clipboard/i,
      });
      expect(copyButton).toBeTruthy();
    });
  });

  describe('Styling', () => {
    it('should use Liquid Glass design system classes', () => {
      const { container } = render(<CodeSnippet code="test" />);

      const preElement = container.querySelector('pre');
      expect(preElement?.className).toContain('bg-gray-900/80');
      expect(preElement?.className).toContain('backdrop-blur-sm');
      expect(preElement?.className).toContain('border-white/10');
      expect(preElement?.className).toContain('rounded-xl');
    });

    it('should have hover-to-show copy button', () => {
      render(<CodeSnippet code="test" />);

      const copyButton = screen.getByRole('button', {
        name: /copy to clipboard/i,
      });

      // Button should have opacity-0 group-hover:opacity-100
      expect(copyButton.className).toContain('opacity-0');
      expect(copyButton.className).toContain('group-hover:opacity-100');
    });

    it('should render with scrollable overflow for long code', () => {
      const { container } = render(
        <CodeSnippet code="a very long line of code that should be scrollable horizontally without wrapping to multiple lines" />
      );

      const preElement = container.querySelector('pre');
      expect(preElement?.className).toContain('overflow-x-auto');
    });

    it('should render code in monospace font', () => {
      const { container } = render(<CodeSnippet code="test code" />);

      const codeElement = container.querySelector('code');
      expect(codeElement?.className).toContain('text-sm');
      expect(codeElement?.className).toContain('text-gray-200');
    });

    it('should have proper button styling', () => {
      render(<CodeSnippet code="test" />);

      const copyButton = screen.getByRole('button', {
        name: /copy to clipboard/i,
      });

      expect(copyButton.className).toContain('bg-white/5');
      expect(copyButton.className).toContain('hover:bg-white/10');
      expect(copyButton.className).toContain('border-white/10');
      expect(copyButton.className).toContain('rounded-lg');
    });
  });

  describe('Props', () => {
    it('should accept code prop', () => {
      const testCode = 'git clone https://github.com/test/repo.git';
      render(<CodeSnippet code={testCode} />);

      expect(screen.getByText(testCode)).toBeTruthy();
    });

    it('should accept optional language prop', () => {
      render(<CodeSnippet code="def hello():" language="python" />);

      const codeElement = screen.getByText('def hello():');
      expect(codeElement.className).toContain('language-python');
    });

    it('should accept optional title prop', () => {
      render(<CodeSnippet code="test" title="Example Code" />);

      expect(screen.getByText('Example Code')).toBeTruthy();
    });

    it('should render without optional props', () => {
      render(<CodeSnippet code="test" />);

      expect(screen.getByText('test')).toBeTruthy();
    });
  });

  describe('Copy Interaction', () => {
    it('should call clipboard API when copy button clicked', async () => {
      const testCode = 'test code to copy';
      vi.mocked(navigator.clipboard.writeText).mockResolvedValue();

      render(<CodeSnippet code={testCode} />);

      const copyButton = screen.getByRole('button', {
        name: /copy to clipboard/i,
      });

      await act(async () => {
        fireEvent.click(copyButton);
        // Wait for async clipboard operation
        await Promise.resolve();
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testCode);
    });

    it('should show Copied notification after successful copy', async () => {
      vi.mocked(navigator.clipboard.writeText).mockResolvedValue();

      render(<CodeSnippet code="test" />);

      const copyButton = screen.getByRole('button', {
        name: /copy to clipboard/i,
      });

      await act(async () => {
        fireEvent.click(copyButton);
        await Promise.resolve();
      });

      expect(screen.getByText('Copied!')).toBeTruthy();
    });

    it('should handle clipboard errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const error = new Error('Clipboard failed');
      vi.mocked(navigator.clipboard.writeText).mockRejectedValue(error);

      render(<CodeSnippet code="test" />);

      const copyButton = screen.getByRole('button', {
        name: /copy to clipboard/i,
      });

      await act(async () => {
        fireEvent.click(copyButton);
        await Promise.resolve();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy:', error);

      consoleErrorSpy.mockRestore();
    });
  });
});
