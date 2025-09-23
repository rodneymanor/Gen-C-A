import { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../../test/test-utils';
import { Button } from '../../../components/ui/Button';

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Click me');
      expect(button).not.toBeDisabled();
    });

    it('should render with custom testId', () => {
      render(<Button testId="custom-button">Test</Button>);
      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<Button className="custom-class">Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('gen-button'); // Should also have default class
    });
  });

  describe('Variants', () => {
    it('should render primary variant by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render ai-powered variant', () => {
      render(<Button variant="ai-powered">AI Powered</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render creative variant', () => {
      render(<Button variant="creative">Creative</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render subtle variant', () => {
      render(<Button variant="subtle">Subtle</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render warning variant', () => {
      render(<Button variant="warning">Warning</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render danger variant', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('should render medium size by default', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render small size', () => {
      render(<Button size="small">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render large size', () => {
      render(<Button size="large">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('States', () => {
    it('should render disabled state', () => {
      render(<Button isDisabled>Disabled</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should render loading state', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('data-loading', 'true');
      
      // Should have loading spinner
      const spinner = button.querySelector('.spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('should show both disabled and loading attributes when both are true', () => {
      render(<Button isDisabled isLoading>Both</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('data-loading', 'true');
    });
  });

  describe('Icons', () => {
    it('should render with iconBefore', () => {
      render(<Button iconBefore={<span data-testid="icon-before">🔥</span>}>With Icon</Button>);
      
      expect(screen.getByTestId('icon-before')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });

    it('should render with iconAfter', () => {
      render(<Button iconAfter={<span data-testid="icon-after">→</span>}>With Icon</Button>);
      
      expect(screen.getByTestId('icon-after')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });

    it('should render with both iconBefore and iconAfter', () => {
      render(
        <Button 
          iconBefore={<span data-testid="icon-before">🔥</span>}
          iconAfter={<span data-testid="icon-after">→</span>}
        >
          Both Icons
        </Button>
      );
      
      expect(screen.getByTestId('icon-before')).toBeInTheDocument();
      expect(screen.getByTestId('icon-after')).toBeInTheDocument();
      expect(screen.getByText('Both Icons')).toBeInTheDocument();
    });

    it('should have proper icon classes', () => {
      render(
        <Button 
          iconBefore={<span>Before</span>}
          iconAfter={<span>After</span>}
        >
          Text
        </Button>
      );
      
      const button = screen.getByRole('button');
      const iconBefore = button.querySelector('.button-icon-before');
      const iconAfter = button.querySelector('.button-icon-after');
      
      expect(iconBefore).toBeInTheDocument();
      expect(iconAfter).toBeInTheDocument();
      expect(iconBefore).toHaveAttribute('aria-hidden', 'true');
      expect(iconAfter).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Full Width', () => {
    it('should render full width when specified', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      // Note: We can't easily test CSS width in jsdom, but we can verify it renders
    });

    it('should not be full width by default', () => {
      render(<Button>Normal Width</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    it('should handle click events', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Clickable</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger click when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick} isDisabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not trigger click when loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick} isLoading>Loading</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle keyboard events', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Keyboard</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle form submission', () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());
      
      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit</Button>
        </form>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Button>Accessible</Button>);
      const button = screen.getByRole('button');
      
      // HTML button elements have implicit button role, so we don't need to test for explicit role attribute
      expect(button).toBeInTheDocument();
      expect(button).not.toHaveAttribute('aria-disabled');
    });

    it('should have ARIA disabled when disabled', () => {
      render(<Button isDisabled>Disabled</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have ARIA disabled when loading', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should be focusable when not disabled', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      render(<Button isDisabled>Not Focusable</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).not.toHaveFocus();
    });

    it('should have proper text content structure', () => {
      render(<Button>Button Text</Button>);
      const button = screen.getByRole('button');
      const textElement = button.querySelector('.button-text');
      
      expect(textElement).toBeInTheDocument();
      expect(textElement).toHaveTextContent('Button Text');
    });

    it('should hide decorative icons from screen readers', () => {
      render(
        <Button iconBefore={<span>🔥</span>} iconAfter={<span>→</span>}>
          Text
        </Button>
      );
      
      const button = screen.getByRole('button');
      const iconBefore = button.querySelector('.button-icon-before');
      const iconAfter = button.querySelector('.button-icon-after');
      
      expect(iconBefore).toHaveAttribute('aria-hidden', 'true');
      expect(iconAfter).toHaveAttribute('aria-hidden', 'true');
    });

    it('should hide loading spinner from screen readers', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      const spinner = button.querySelector('.spinner')?.parentElement;
      
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Custom Props', () => {
    it('should pass through additional HTML attributes', () => {
      render(
        <Button 
          title="Custom tooltip"
          tabIndex={0}
          data-custom="value"
        >
          Custom Props
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Custom tooltip');
      expect(button).toHaveAttribute('tabIndex', '0');
      expect(button).toHaveAttribute('data-custom', 'value');
    });

    it('should support ref forwarding', () => {
      const buttonRef = createRef<HTMLButtonElement>();

      const TestComponent = () => (
        <Button ref={buttonRef}>
          Ref Test
        </Button>
      );

      render(<TestComponent />);

      expect(buttonRef.current).toBeInstanceOf(HTMLButtonElement);
      expect(buttonRef.current?.textContent).toBe('Ref Test');
    });
  });

  describe('Edge Cases', () => {
    it('should render without children', () => {
      render(<Button />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('');
    });

    it('should render with null children', () => {
      render(<Button>{null}</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render with undefined children', () => {
      render(<Button>{undefined}</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render with complex children', () => {
      render(
        <Button>
          <div>Complex</div>
          <span>Children</span>
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('Children')).toBeInTheDocument();
    });

    it('should maintain consistent behavior with rapid state changes', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      const { rerender } = render(<Button onClick={handleClick}>Normal</Button>);
      
      // Click when normal
      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      // Change to loading
      rerender(<Button onClick={handleClick} isLoading>Loading</Button>);
      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1); // Should not increment
      
      // Change back to normal
      rerender(<Button onClick={handleClick}>Normal Again</Button>);
      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(2); // Should increment again
    });
  });
});
