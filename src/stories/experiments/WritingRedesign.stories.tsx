import type { Meta, StoryObj } from '@storybook/react';
import { WritingRedesignShowcase } from '../../test/writing-redesign';

const meta: Meta<typeof WritingRedesignShowcase> = {
  title: 'Experiments/Writing Redesign',
  component: WritingRedesignShowcase,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <WritingRedesignShowcase />,
};
