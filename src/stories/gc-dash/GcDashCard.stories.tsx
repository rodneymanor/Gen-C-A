import type { Meta, StoryObj } from '@storybook/react';
import {
  GcDashButton,
  GcDashCard,
  GcDashCardBody,
  GcDashCardFooter,
  GcDashCardHeader,
  GcDashCardSubtitle,
  GcDashCardTitle,
  GcDashMetricCard,
} from '../../components/gc-dash';

const meta: Meta<typeof GcDashCard> = {
  title: 'GC Dash/Surfaces/Card',
  component: GcDashCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <GcDashCard interactive>
      <GcDashCardHeader>
        <div>
          <GcDashCardTitle>AI launch kickoff</GcDashCardTitle>
          <GcDashCardSubtitle>Align plan, scope, and key owners</GcDashCardSubtitle>
        </div>
        <GcDashButton variant="secondary">Open brief</GcDashButton>
      </GcDashCardHeader>
      <GcDashCardBody>
        <p style={{ margin: 0, color: 'var(--color-text-secondary, #42526e)' }}>
          Capture priorities, partner teams, and key collateral. This card is optimized for the dashboard
          overview state inspired by the Anthropic UI kit.
        </p>
      </GcDashCardBody>
      <GcDashCardFooter>
        <GcDashButton variant="ghost">Duplicate</GcDashButton>
        <GcDashButton variant="primary">Review</GcDashButton>
      </GcDashCardFooter>
    </GcDashCard>
  ),
};

export const Metric: Story = {
  render: () => (
    <GcDashMetricCard
      label="Completion rate"
      metric="87%"
      delta={{ value: 12, trend: 'up', label: 'vs last week' }}
      icon="📈"
    />
  ),
};
