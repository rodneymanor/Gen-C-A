import type { Meta, StoryObj } from '@storybook/react';
import { GcDashTabs, type GcDashTabItem } from '../../components/gc-dash';

const tabs: GcDashTabItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: '📋',
    content: <p>Snapshot of project health, owners, and AI insights.</p>,
  },
  {
    id: 'activity',
    label: 'Activity',
    badge: '12',
    content: <p>Chronological feed of doc edits, prompts, and approvals.</p>,
  },
  {
    id: 'automations',
    label: 'Automations',
    content: <p>Manage Anthropic workflows, triggers, and connected tools.</p>,
  },
];

const meta: Meta<typeof GcDashTabs> = {
  title: 'GC Dash/Navigation/Tabs',
  component: GcDashTabs,
  tags: ['autodocs'],
  args: {
    tabs,
  },
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Underline: Story = {
  args: {
    variant: 'underline',
  },
};

export const Pill: Story = {
  args: {
    variant: 'pill',
  },
};

export const Segmented: Story = {
  args: {
    variant: 'segmented',
    stretch: true,
  },
};
