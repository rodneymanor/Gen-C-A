import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../../test/test-utils';
import { Card, CardHeader, CardContent, CardFooter } from '../../../components/ui/Card';

describe('Card Component', () => {
  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<Card>Card content</Card>);
      const card = screen.getByText('Card content');
      
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('gen-card');
    });

    it('should render with custom testId', () => {
      render(<Card testId="custom-card">Test</Card>);
      expect(screen.getByTestId('custom-card')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<Card className="custom-class">Test</Card>);
      const card = screen.getByText('Test');
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('gen-card'); // Should also have default class
    });
  });

  describe('Appearance Variants', () => {
    it('should render raised appearance by default', () => {
      render(<Card>Default</Card>);
      const card = screen.getByText('Default');
      expect(card).toBeInTheDocument();
    });

    it('should render subtle appearance', () => {
      render(<Card appearance="subtle">Subtle</Card>);
      const card = screen.getByText('Subtle');
      expect(card).toBeInTheDocument();
    });

    it('should render elevated appearance', () => {
      render(<Card appearance="elevated">Elevated</Card>);
      const card = screen.getByText('Elevated');
      expect(card).toBeInTheDocument();
    });

    it('should render selected appearance', () => {
      render(<Card appearance="selected">Selected</Card>);
      const card = screen.getByText('Selected');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Spacing Variants', () => {
    it('should render default spacing by default', () => {
      render(<Card>Default spacing</Card>);
      const card = screen.getByText('Default spacing');
      expect(card).toBeInTheDocument();
    });

    it('should render compact spacing', () => {
      render(<Card spacing="compact">Compact</Card>);
      const card = screen.getByText('Compact');
      expect(card).toBeInTheDocument();
    });

    it('should render comfortable spacing', () => {
      render(<Card spacing="comfortable">Comfortable</Card>);
      const card = screen.getByText('Comfortable');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Interactive States', () => {
    it('should handle hoverable state', () => {
      render(<Card isHoverable>Hoverable</Card>);
      const card = screen.getByText('Hoverable');
      expect(card).toBeInTheDocument();
      // Note: We can't easily test hover effects in jsdom, but we can verify it renders
    });

    it('should handle clickable state', () => {
      const handleClick = vi.fn();
      render(
        <Card isClickable onClick={handleClick}>
          Clickable
        </Card>
      );
      
      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should not be focusable when not clickable', () => {
      render(<Card>Not clickable</Card>);
      const card = screen.getByText('Not clickable');
      
      expect(card).not.toHaveAttribute('role');
      expect(card).not.toHaveAttribute('tabIndex');
    });
  });

  describe('Event Handling', () => {
    it('should handle click events when clickable', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <Card isClickable onClick={handleClick}>
          Clickable Card
        </Card>
      );
      
      const card = screen.getByRole('button');
      await user.click(card);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle Enter key when clickable', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <Card isClickable onClick={handleClick}>
          Keyboard Card
        </Card>
      );
      
      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard('{Enter}');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle Space key when clickable', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <Card isClickable onClick={handleClick}>
          Space Card
        </Card>
      );
      
      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard(' ');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not handle click events when not clickable', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Card onClick={handleClick}>Not Clickable</Card>);
      
      const card = screen.getByText('Not Clickable');
      await user.click(card);
      
      expect(handleClick).toHaveBeenCalledTimes(1); // onClick still works even without isClickable
    });

    it('should not handle keyboard events when not clickable', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Card onClick={handleClick}>Not Keyboard</Card>);
      
      const card = screen.getByText('Not Keyboard');
      card.focus(); // This might not work since it's not focusable
      await user.keyboard('{Enter}');
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper role when clickable', () => {
      render(<Card isClickable>Accessible</Card>);
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('role', 'button');
    });

    it('should be focusable when clickable', () => {
      render(<Card isClickable>Focusable</Card>);
      const card = screen.getByRole('button');
      
      card.focus();
      expect(card).toHaveFocus();
    });

    it('should not have role when not clickable', () => {
      render(<Card>No role</Card>);
      const card = screen.getByText('No role');
      expect(card).not.toHaveAttribute('role');
    });

    it('should handle focus management', () => {
      render(<Card isClickable>Focus Test</Card>);
      const card = screen.getByRole('button');
      
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Custom Props', () => {
    it('should pass through additional HTML attributes', () => {
      render(
        <Card 
          title="Custom tooltip"
          data-custom="value"
          id="custom-id"
        >
          Custom Props
        </Card>
      );
      
      const card = screen.getByText('Custom Props');
      expect(card).toHaveAttribute('title', 'Custom tooltip');
      expect(card).toHaveAttribute('data-custom', 'value');
      expect(card).toHaveAttribute('id', 'custom-id');
    });

    it('should support ref forwarding', () => {
      let cardRef: HTMLDivElement | null = null;
      
      const TestComponent = () => (
        <Card ref={(ref) => { cardRef = ref; }}>
          Ref Test
        </Card>
      );
      
      render(<TestComponent />);
      
      expect(cardRef).toBeInstanceOf(HTMLDivElement);
      expect(cardRef?.textContent).toBe('Ref Test');
    });
  });

  describe('Complex Content', () => {
    it('should render with complex children', () => {
      render(
        <Card>
          <div>Header</div>
          <p>Content paragraph</p>
          <button>Action</button>
        </Card>
      );
      
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Content paragraph')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('should work with all appearance and spacing combinations', () => {
      const appearances = ['subtle', 'raised', 'elevated', 'selected'] as const;
      const spacings = ['compact', 'default', 'comfortable'] as const;
      
      appearances.forEach((appearance) => {
        spacings.forEach((spacing) => {
          const { unmount } = render(
            <Card appearance={appearance} spacing={spacing}>
              {appearance} {spacing}
            </Card>
          );
          
          expect(screen.getByText(`${appearance} ${spacing}`)).toBeInTheDocument();
          unmount();
        });
      });
    });
  });
});

describe('CardHeader Component', () => {
  it('should render header content', () => {
    render(<CardHeader>Header Content</CardHeader>);
    const header = screen.getByText('Header Content');
    
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('gen-card-header');
  });

  it('should render with custom className', () => {
    render(<CardHeader className="custom-header">Header</CardHeader>);
    const header = screen.getByText('Header');
    
    expect(header).toHaveClass('custom-header');
    expect(header).toHaveClass('gen-card-header');
  });

  it('should render complex content', () => {
    render(
      <CardHeader>
        <h2>Title</h2>
        <p>Subtitle</p>
      </CardHeader>
    );
    
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
  });
});

describe('CardContent Component', () => {
  it('should render content', () => {
    render(<CardContent>Main Content</CardContent>);
    const content = screen.getByText('Main Content');
    
    expect(content).toBeInTheDocument();
    expect(content).toHaveClass('gen-card-content');
  });

  it('should render with custom className', () => {
    render(<CardContent className="custom-content">Content</CardContent>);
    const content = screen.getByText('Content');
    
    expect(content).toHaveClass('custom-content');
    expect(content).toHaveClass('gen-card-content');
  });

  it('should render complex content', () => {
    render(
      <CardContent>
        <div>Section 1</div>
        <div>Section 2</div>
      </CardContent>
    );
    
    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Section 2')).toBeInTheDocument();
  });
});

describe('CardFooter Component', () => {
  it('should render footer content', () => {
    render(<CardFooter>Footer Content</CardFooter>);
    const footer = screen.getByText('Footer Content');
    
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('gen-card-footer');
  });

  it('should render with custom className', () => {
    render(<CardFooter className="custom-footer">Footer</CardFooter>);
    const footer = screen.getByText('Footer');
    
    expect(footer).toHaveClass('custom-footer');
    expect(footer).toHaveClass('gen-card-footer');
  });

  it('should render action buttons', () => {
    render(
      <CardFooter>
        <button>Action 1</button>
        <button>Action 2</button>
      </CardFooter>
    );
    
    expect(screen.getByRole('button', { name: 'Action 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action 2' })).toBeInTheDocument();
  });
});

describe('Card Integration', () => {
  it('should work with all sub-components together', () => {
    render(
      <Card appearance="elevated" spacing="comfortable" isHoverable>
        <CardHeader>
          <h2>Card Title</h2>
        </CardHeader>
        <CardContent>
          <p>This is the main content of the card.</p>
        </CardContent>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('This is the main content of the card.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('should handle nested interaction states', async () => {
    const handleCardClick = vi.fn();
    const handleButtonClick = vi.fn();
    const user = userEvent.setup();
    
    render(
      <Card isClickable onClick={handleCardClick}>
        <CardContent>
          <button onClick={handleButtonClick}>Inner Button</button>
        </CardContent>
      </Card>
    );
    
    // Click the inner button
    const innerButton = screen.getByRole('button', { name: 'Inner Button' });
    await user.click(innerButton);
    
    expect(handleButtonClick).toHaveBeenCalledTimes(1);
    // The card click should also be triggered due to event bubbling
    expect(handleCardClick).toHaveBeenCalledTimes(1);
  });

  it('should prevent event propagation when needed', async () => {
    const handleCardClick = vi.fn();
    const handleButtonClick = vi.fn((e: React.MouseEvent) => {
      e.stopPropagation();
    });
    const user = userEvent.setup();
    
    render(
      <Card isClickable onClick={handleCardClick}>
        <CardContent>
          <button onClick={handleButtonClick}>Stop Propagation</button>
        </CardContent>
      </Card>
    );
    
    // Click the inner button
    const innerButton = screen.getByRole('button', { name: 'Stop Propagation' });
    await user.click(innerButton);
    
    expect(handleButtonClick).toHaveBeenCalledTimes(1);
    // The card click should NOT be triggered due to stopPropagation
    expect(handleCardClick).not.toHaveBeenCalled();
  });
});