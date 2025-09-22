import type { Meta, StoryObj } from '@storybook/react';
import { GcDashAvatar } from '../../components/gc-dash';

const meta: Meta<typeof GcDashAvatar> = {
  title: 'GC Dash/Identity/Avatar',
  component: GcDashAvatar,
  tags: ['autodocs'],
  args: {
    name: 'Jordan Chen',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <GcDashAvatar {...args} size="xs" />
      <GcDashAvatar {...args} size="sm" />
      <GcDashAvatar {...args} size="md" />
      <GcDashAvatar {...args} size="lg" />
      <GcDashAvatar {...args} size="xl" />
    </div>
  ),
};

export const Status: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 16 }}>
      <GcDashAvatar {...args} status="online" />
      <GcDashAvatar {...args} status="away" />
      <GcDashAvatar {...args} status="busy" />
      <GcDashAvatar {...args} status="offline" />
      <GcDashAvatar {...args} status="focus" />
    </div>
  ),
};

export const AccentColor: Story = {
  args: {
    accentColor: '#8b5cf6',
  },
};
