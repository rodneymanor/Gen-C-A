import type { Meta, StoryObj } from '@storybook/react';
import { GcDashBlankSlate, GcDashButton } from '../../components/gc-dash';

const meta: Meta<typeof GcDashBlankSlate> = {
  title: 'gc-dash/Blank Slate',
  component: GcDashBlankSlate,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'No scripts yet',
    description: 'Kick off your first draft by choosing a workflow or dropping in notes for Claude to expand.',
  },
  render: (args) => (
    <GcDashBlankSlate
      {...args}
      primaryAction={<GcDashButton>Start drafting</GcDashButton>}
      secondaryAction={<GcDashButton variant="ghost">Browse inspiration</GcDashButton>}
    />
  ),
};

export const WithIcon: Story = {
  args: {
    title: 'Ready when you are',
    description: 'Create a new script or import one from your existing library to begin collaborating with Claude.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M6 12.75L9.6 16.5L18 7.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  render: (args) => (
    <GcDashBlankSlate
      {...args}
      primaryAction={<GcDashButton>New script</GcDashButton>}
    />
  ),
};
