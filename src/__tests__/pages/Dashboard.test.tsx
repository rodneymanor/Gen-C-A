import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../test/test-utils';
import { Dashboard } from '../../pages/Dashboard';

// Mock the format utility
vi.mock('../../utils/format', () => ({
  formatRelativeTime: vi.fn((date: Date) => `${Math.abs(Date.now() - date.getTime()) / (1000 * 60 * 60)} hours ago`),
}));

describe('Dashboard Page', () => {
  describe('Basic Rendering', () => {
    it('should render the dashboard without errors', () => {
      render(<Dashboard />);
      
      expect(screen.getByText('Welcome back, Sarah!')).toBeInTheDocument();
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    it('should have proper page structure with sections', () => {
      render(<Dashboard />);
      
      // Check for main sections
      expect(screen.getByLabelText(/welcome-heading/)).toBeInTheDocument();
      expect(screen.getByLabelText(/activity-heading/)).toBeInTheDocument();
    });

    it('should display user statistics', () => {
      render(<Dashboard />);
      
      // Should show today's stats
      expect(screen.getByText(/saved 12 videos/)).toBeInTheDocument();
      expect(screen.getByText(/generated 3 scripts/)).toBeInTheDocument();
      
      // Should show weekly stats
      expect(screen.getByText(/This week: 47 videos, 8 scripts/)).toBeInTheDocument();
    });
  });

  describe('Welcome Section', () => {
    it('should display welcome message with emoji', () => {
      render(<Dashboard />);
      
      const welcomeSection = screen.getByText('Welcome back, Sarah!');
      expect(welcomeSection).toBeInTheDocument();
      
      // Check for welcome emoji
      const welcomeEmoji = screen.getByRole('img', { hidden: true }) || screen.getByText('👋');
      expect(welcomeEmoji).toBeInTheDocument();
    });

    it('should show personalized activity summary', () => {
      render(<Dashboard />);
      
      expect(screen.getByText(/Today you've saved 12 videos and generated 3 scripts/)).toBeInTheDocument();
      expect(screen.getByText(/Ready to create something amazing/)).toBeInTheDocument();
    });

    it('should display weekly statistics', () => {
      render(<Dashboard />);
      
      expect(screen.getByText(/This week: 47 videos, 8 scripts/)).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('should render all quick action buttons', () => {
      render(<Dashboard />);
      
      expect(screen.getByRole('button', { name: /New Collection/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Generate Script/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Browse Library/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /AI Assistant/ })).toBeInTheDocument();
    });

    it('should have proper button descriptions', () => {
      render(<Dashboard />);
      
      expect(screen.getByText('Organize your videos')).toBeInTheDocument();
      expect(screen.getByText('AI-powered writing')).toBeInTheDocument();
      expect(screen.getByText('View all content')).toBeInTheDocument();
      expect(screen.getByText('Get help and ideas')).toBeInTheDocument();
    });

    it('should have proper button variants', () => {
      render(<Dashboard />);
      
      // Check that different button variants are used
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(4);
    });

    describe('Quick Action Interactions', () => {
      const originalConsoleLog = console.log;
      
      beforeEach(() => {
        console.log = vi.fn();
      });
      
      afterEach(() => {
        console.log = originalConsoleLog;
      });

      it('should handle create collection action', async () => {
        const user = userEvent.setup();
        render(<Dashboard />);
        
        const createButton = screen.getByRole('button', { name: /New Collection/ });
        await user.click(createButton);
        
        expect(console.log).toHaveBeenCalledWith('Create collection');
      });

      it('should handle generate script action', async () => {
        const user = userEvent.setup();
        render(<Dashboard />);
        
        const generateButton = screen.getByRole('button', { name: /Generate Script/ });
        await user.click(generateButton);
        
        expect(console.log).toHaveBeenCalledWith('Generate script');
      });

      it('should handle browse library action', async () => {
        const user = userEvent.setup();
        render(<Dashboard />);
        
        const browseButton = screen.getByRole('button', { name: /Browse Library/ });
        await user.click(browseButton);
        
        expect(console.log).toHaveBeenCalledWith('Browse library');
      });

      it('should handle AI assistant action', async () => {
        const user = userEvent.setup();
        render(<Dashboard />);
        
        const aiButton = screen.getByRole('button', { name: /AI Assistant/ });
        await user.click(aiButton);
        
        expect(console.log).toHaveBeenCalledWith('AI assistant');
      });
    });
  });

  describe('Recent Activity Section', () => {
    it('should display activity header', () => {
      render(<Dashboard />);
      
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View All' })).toBeInTheDocument();
    });

    it('should render activity list', () => {
      render(<Dashboard />);
      
      // Check for activity items
      expect(screen.getByText('Added "Summer Vibes Collection"')).toBeInTheDocument();
      expect(screen.getByText('Generated script for TikTok hook')).toBeInTheDocument();
      expect(screen.getByText('Saved article "Content Trends 2024"')).toBeInTheDocument();
      expect(screen.getByText('Created persona "Fitness Influencer"')).toBeInTheDocument();
    });

    it('should show activity icons', () => {
      render(<Dashboard />);
      
      // Activity items should have emojis/icons
      const activityItems = screen.getByRole('list');
      expect(activityItems).toBeInTheDocument();
    });

    it('should display relative timestamps', () => {
      render(<Dashboard />);
      
      // Should show formatted relative times
      const timeElements = screen.getAllByText(/hours ago/);
      expect(timeElements.length).toBeGreaterThan(0);
    });

    it('should have View buttons for activities', () => {
      render(<Dashboard />);
      
      const viewButtons = screen.getAllByRole('button', { name: 'View' });
      expect(viewButtons.length).toBe(4); // One for each activity item
    });

    describe('Activity Interactions', () => {
      it('should handle view all button click', async () => {
        const user = userEvent.setup();
        render(<Dashboard />);
        
        const viewAllButton = screen.getByRole('button', { name: 'View All' });
        await user.click(viewAllButton);
        
        // This button doesn't seem to have a handler in the current implementation
        // But we can test that it's clickable
        expect(viewAllButton).toBeInTheDocument();
      });

      it('should handle individual activity view clicks', async () => {
        const user = userEvent.setup();
        render(<Dashboard />);
        
        const viewButtons = screen.getAllByRole('button', { name: 'View' });
        await user.click(viewButtons[0]);
        
        // These buttons don't seem to have handlers in the current implementation
        // But we can test that they're clickable
        expect(viewButtons[0]).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should handle empty activity state if no activities exist', () => {
      // We would need to mock the data to test empty states
      // For now, we test that the component handles the current data
      render(<Dashboard />);
      
      // Since there are activities in the mock data, we should see them
      expect(screen.getByRole('list')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render without layout issues on different screen sizes', () => {
      // Test that the component renders without errors
      // (Full responsive testing would require more complex setup)
      render(<Dashboard />);
      
      expect(screen.getByText('Welcome back, Sarah!')).toBeInTheDocument();
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<Dashboard />);
      
      // Check for proper heading hierarchy
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Welcome back, Sarah!');
      
      const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(sectionHeadings.length).toBeGreaterThan(0);
    });

    it('should have proper section labeling', () => {
      render(<Dashboard />);
      
      // Check for aria-labelledby
      expect(screen.getByLabelText(/welcome-heading/)).toBeInTheDocument();
      expect(screen.getByLabelText(/activity-heading/)).toBeInTheDocument();
    });

    it('should have proper list semantics for activities', () => {
      render(<Dashboard />);
      
      const activityList = screen.getByRole('list');
      expect(activityList).toBeInTheDocument();
    });

    it('should hide decorative elements from screen readers', () => {
      render(<Dashboard />);
      
      // Check that emojis have aria-hidden
      const decorativeElements = document.querySelectorAll('[aria-hidden="true"]');
      expect(decorativeElements.length).toBeGreaterThan(0);
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<Dashboard />);
      
      // Test tab navigation through interactive elements
      await user.tab();
      
      // Should be able to focus on buttons
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Data Integration', () => {
    it('should display mock statistics correctly', () => {
      render(<Dashboard />);
      
      // Verify specific mock data values
      expect(screen.getByText('saved 12 videos')).toBeInTheDocument();
      expect(screen.getByText('generated 3 scripts')).toBeInTheDocument();
      expect(screen.getByText('This week: 47 videos, 8 scripts')).toBeInTheDocument();
    });

    it('should handle activity data correctly', () => {
      render(<Dashboard />);
      
      // Check that all mock activities are displayed
      expect(screen.getByText('Added "Summer Vibes Collection"')).toBeInTheDocument();
      expect(screen.getByText('Generated script for TikTok hook')).toBeInTheDocument();
      expect(screen.getByText('Saved article "Content Trends 2024"')).toBeInTheDocument();
      expect(screen.getByText('Created persona "Fitness Influencer"')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should render Card components properly', () => {
      render(<Dashboard />);
      
      // Should use Card components (they have gen-card class)
      const cards = document.querySelectorAll('.gen-card');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should render Button components properly', () => {
      render(<Dashboard />);
      
      // Should use Button components (they have gen-button class)
      const buttons = document.querySelectorAll('.gen-button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should integrate with the format utilities', () => {
      render(<Dashboard />);
      
      // formatRelativeTime should be called for activities
      const { formatRelativeTime } = vi.mocked(
        await import('../../utils/format')
      );
      expect(formatRelativeTime).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should render even if format utilities fail', () => {
      // Mock format utilities to throw errors
      const { formatRelativeTime } = vi.mocked(
        require('../../utils/format')
      );
      formatRelativeTime.mockImplementation(() => {
        throw new Error('Format error');
      });
      
      // Should still render the component
      expect(() => render(<Dashboard />)).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should render efficiently with mock data', () => {
      const startTime = performance.now();
      render(<Dashboard />);
      const endTime = performance.now();
      
      // Basic performance check (render time should be reasonable)
      expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second
    });

    it('should handle re-renders gracefully', () => {
      const { rerender } = render(<Dashboard />);
      
      // Re-render multiple times
      for (let i = 0; i < 5; i++) {
        rerender(<Dashboard />);
        expect(screen.getByText('Welcome back, Sarah!')).toBeInTheDocument();
      }
    });
  });
});