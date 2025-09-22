import type { Meta, StoryObj } from '@storybook/react';
import { GcDashLoadingSpinner } from '../../components/gc-dash';

const meta: Meta<typeof GcDashLoadingSpinner> = {
  title: 'GC Dash/Feedback/Loading Spinner',
  component: GcDashLoadingSpinner,
  tags: ['autodocs'],
  args: {
    size: 24,
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OnDark: Story = {
  args: {
    lightOnDark: true,
  },
  render: (args) => (
    <div style={{ background: '#0b5cff', padding: 24, display: 'inline-flex', borderRadius: 16 }}>
      <GcDashLoadingSpinner {...args} />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <GcDashLoadingSpinner size={16} />
      <GcDashLoadingSpinner size={20} />
      <GcDashLoadingSpinner size={28} />
    </div>
  ),
};
