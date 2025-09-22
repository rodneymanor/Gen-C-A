import type { Meta, StoryObj } from '@storybook/react';
import { GcDashFeatureCard } from '../../components/gc-dash';

const meta: Meta<typeof GcDashFeatureCard> = {
  title: 'GC Dash/Marketing/Feature Card',
  component: GcDashFeatureCard,
  tags: ['autodocs'],
  args: {
    title: 'Developer Docs',
    description: 'Get started with the Claude Developer Platform',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const BookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4.5 4.2C4.5 3.54 5.04 3 5.7 3h6.6c.66 0 1.2.54 1.2 1.2v9.6c0 .66-.54 1.2-1.2 1.2H5.7a1.2 1.2 0 01-1.2-1.2V4.2z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M7 6h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M7 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const Default: Story = {
  args: {
    icon: <BookIcon />,
  },
};

export const Highlighted: Story = {
  args: {
    icon: <BookIcon />,
    highlight: true,
    description: 'Priority resources for onboarding teams',
  },
};
