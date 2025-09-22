import type { Meta, StoryObj } from '@storybook/react';
import { GcDashButton, GcDashSearchBar } from '../../components/gc-dash';

const meta: Meta<typeof GcDashSearchBar> = {
  title: 'GC Dash/Navigation/Search',
  component: GcDashSearchBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    placeholder: 'Search Anthropic assets',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    filters: <GcDashButton variant="ghost">Filters</GcDashButton>,
    onSubmitSearch: (value: string) => console.log('Searching for', value),
  },
};

export const Minimal: Story = {
  args: {
    filters: null,
    submitLabel: 'Go',
  },
};
