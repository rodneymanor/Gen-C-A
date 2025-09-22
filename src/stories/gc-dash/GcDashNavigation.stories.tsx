import type { Meta, StoryObj } from '@storybook/react';
import {
  GcDashNavButtons,
  GcDashIconButton,
  GcDashAddContentButton,
  GcDashModelButton,
  GcDashPlanChip,
} from '../../components/gc-dash';
import { useState } from 'react';

type NavMeta = Meta<typeof GcDashNavButtons>;

const meta: NavMeta = {
  title: 'GC Dash/Navigation/Controls',
  component: GcDashNavButtons,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const PrevNext: Story = {
  render: (args) => (
    <GcDashNavButtons {...args} />
  ),
  args: {
    disablePrevious: false,
    disableNext: false,
  },
};

export const IconButtons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <GcDashIconButton aria-label="Open menu">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 8h10M3 4h10M3 12h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </GcDashIconButton>
      <GcDashIconButton tone="danger" aria-label="Delete">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </GcDashIconButton>
    </div>
  ),
};

export const AddContent: Story = {
  render: () => <GcDashAddContentButton label="Add content" />, 
};

export const ModelSelection: Story = {
  render: () => {
    const [model, setModel] = useState('claude-3-5');
    return (
      <div style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
        <GcDashModelButton
          model="Claude 3.5"
          description="Balanced speed and quality"
          selected={model === 'claude-3-5'}
          onClick={() => setModel('claude-3-5')}
        />
        <GcDashModelButton
          model="Claude 3 Opus"
          description="Highest reasoning accuracy"
          selected={model === 'claude-3-opus'}
          onClick={() => setModel('claude-3-opus')}
        />
      </div>
    );
  },
};

export const PlanChip: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <GcDashPlanChip planName="Team" info="Active" />
      <GcDashPlanChip planName="Enterprise" info="Upgrade" highlighted />
    </div>
  ),
};
