import type { Meta, StoryObj } from '@storybook/react';
import { GcDashButton, GcDashLabel } from '../../components/gc-dash';

const meta: Meta<typeof GcDashLabel> = {
  title: 'GC Dash/Messaging/Label',
  component: GcDashLabel,
  tags: ['autodocs'],
  args: {
    children: 'Anthropic',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Tones: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <GcDashLabel {...args} tone="neutral">Neutral</GcDashLabel>
      <GcDashLabel {...args} tone="primary">Primary</GcDashLabel>
      <GcDashLabel {...args} tone="info">Info</GcDashLabel>
      <GcDashLabel {...args} tone="success">Success</GcDashLabel>
      <GcDashLabel {...args} tone="warning">Warning</GcDashLabel>
      <GcDashLabel {...args} tone="danger">Danger</GcDashLabel>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <GcDashLabel tone="primary" variant="soft">Soft</GcDashLabel>
      <GcDashLabel tone="primary" variant="solid">Solid</GcDashLabel>
      <GcDashLabel tone="primary" variant="outline">Outline</GcDashLabel>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <GcDashLabel tone="info" leadingIcon="✨">AI Assisted</GcDashLabel>
      <GcDashLabel tone="success" trailingIcon="✓">Validated</GcDashLabel>
    </div>
  ),
};

export const Interactive: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <GcDashLabel tone="primary" interactive>Filter: Claude</GcDashLabel>
      <GcDashButton variant="ghost">Clear filters</GcDashButton>
    </div>
  ),
};
