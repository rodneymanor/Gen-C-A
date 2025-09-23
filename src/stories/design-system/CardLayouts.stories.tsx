import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

import '../../styles/tokens.css';
import '../../styles/globals.css';

const meta = {
  title: 'Design System/Cards',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: 420,
          padding: 'var(--space-8)',
          background: 'var(--color-neutral-50)',
          borderRadius: 'var(--radius-large)',
        }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    spacing: 'comfortable',
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

const CardExample = (args: Partial<ComponentProps<typeof Card>>) => (
  <Card {...args}>
    <CardHeader>
      <h3 style={{ margin: 0 }}>Creator Highlights</h3>
    </CardHeader>
    <CardContent>
      <p style={{ margin: '0 0 var(--space-4) 0', color: 'var(--color-neutral-700)' }}>
        Use this card pattern to group related information or interactive controls.
      </p>
      <ul style={{ margin: 0, paddingLeft: 'var(--space-5)', color: 'var(--color-neutral-600)' }}>
        <li>Supports subtle, raised, elevated, and selected states</li>
        <li>Optional hover animation for interactive cards</li>
        <li>Combine with actions in the footer</li>
      </ul>
    </CardContent>
    <CardFooter>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Button variant="primary">View details</Button>
        <Button variant="secondary">Share</Button>
      </div>
    </CardFooter>
  </Card>
);

export const Subtle: Story = {
  args: { children: null },
  render: (args) => <CardExample {...args} appearance="subtle" />,
};

export const RaisedHoverable: Story = {
  args: { children: null },
  render: (args) => <CardExample {...args} appearance="raised" isHoverable />,
};

export const Clickable: Story = {
  args: { children: null },
  render: (args) => <CardExample {...args} appearance="raised" isClickable />,
};

export const Selected: Story = {
  args: { children: null },
  render: (args) => <CardExample {...args} appearance="selected" isClickable />,
};
