/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from '../page';

describe('Landing Page i18n', () => {
  it('should render language switcher', () => {
    const { container } = render(<Home />);

    // Find language switcher in fixed position
    const switcher = container.querySelector('.fixed.top-6.right-6');
    expect(switcher).toBeInTheDocument();

    const buttons = within(switcher as HTMLElement).getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });

  it('should switch language when clicking language buttons', () => {
    const { container } = render(<Home />);

    const switcher = container.querySelector('.fixed.top-6.right-6');
    const buttons = within(switcher as HTMLElement).getAllByRole('button');

    // Initially EN button should have bg-white class
    expect(buttons[0]).toHaveClass('bg-white');
    expect(buttons[1]).not.toHaveClass('bg-white');

    // Click Japanese button
    fireEvent.click(buttons[1]);

    // Now JA button should have bg-white class
    expect(buttons[0]).not.toHaveClass('bg-white');
    expect(buttons[1]).toHaveClass('bg-white');

    // Click EN button again
    fireEvent.click(buttons[0]);

    // Back to EN
    expect(buttons[0]).toHaveClass('bg-white');
    expect(buttons[1]).not.toHaveClass('bg-white');
  });

  it('should highlight active language button', () => {
    const { container } = render(<Home />);

    const switcher = container.querySelector('.fixed.top-6.right-6');
    const buttons = within(switcher as HTMLElement).getAllByRole('button');
    const enButton = buttons[0];
    const jaButton = buttons[1];

    // Initially EN should be active (has white background)
    expect(enButton).toHaveClass('bg-white');
    expect(jaButton).not.toHaveClass('bg-white');

    // Click Japanese
    fireEvent.click(jaButton);

    // Now JA should be active
    expect(enButton).not.toHaveClass('bg-white');
    expect(jaButton).toHaveClass('bg-white');
  });
});
