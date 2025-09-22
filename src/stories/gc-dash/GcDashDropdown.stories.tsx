import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  GcDashDropdown,
  type GcDashDropdownOption,
} from '../../components/gc-dash';

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6.75" stroke="currentColor" strokeWidth="1.2" />
    <path d="M8 4.8V8.1L10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2l1.2 2.8 2.8 1.2-2.8 1.2L8 9.2 6.8 7.2 4 6l2.8-1.2L8 2z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
  </svg>
);

const ArrowLoopIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.5 6.5A4.5 4.5 0 018 3.5h1V2l2.5 2.5L9 7V5.5H8a3 3 0 00-3 3c0 .3.04.59.12.86l-1.05.3A4.5 4.5 0 013.5 6.5zM12.5 9.5A4.5 4.5 0 018 12.5H7v1.5L4.5 11.5 7 9v1.5h1a3 3 0 003-3 3 3 0 00-.12-.86l1.05-.3c.07.28.12.57.12.86z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const options: GcDashDropdownOption[] = [
  {
    value: 'recent-activity',
    label: 'Recent activity',
    description: 'Latest updates across projects',
    icon: <ClockIcon />,
  },
  {
    value: 'recently-created',
    label: 'Recently created',
    description: 'New projects in the workspace',
    icon: <SparkleIcon />,
  },
  {
    value: 'recently-updated',
    label: 'Recently updated',
    description: 'Recently edited documents',
    icon: <ArrowLoopIcon />,
  },
];

const meta: Meta<typeof GcDashDropdown> = {
  title: 'GC Dash/Form/Dropdown',
  component: GcDashDropdown,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    label: 'Workflow',
    options,
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.defaultValue);
    return (
      <div style={{ display: 'grid', gap: 6, maxWidth: 240 }}>
        <span style={{ fontSize: 14, color: 'rgba(9, 30, 66, 0.65)' }}>Sort by</span>
        <GcDashDropdown
          {...args}
          selectedValue={value}
          onSelect={(next) => setValue(next)}
        />
      </div>
    );
  },
  args: {
    placeholder: 'Activity',
    defaultValue: 'recent-activity',
  },
};

export const AlignEnd: Story = {
  args: {
    label: 'Filter results',
    placeholder: 'All items',
    align: 'end',
    options,
  },
  render: (args) => {
    const [value, setValue] = useState<string | undefined>();
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', width: 280 }}>
        <GcDashDropdown
          {...args}
          selectedValue={value}
          onSelect={(next) => setValue(next)}
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  args: {
    label: 'Sort menu',
    placeholder: 'Unavailable',
    disabled: true,
    options,
  },
};

export const LongList: Story = {
  args: {
    label: 'Collections',
    placeholder: 'Select collection',
    options: Array.from({ length: 12 }, (_, index) => ({
      value: `collection-${index + 1}`,
      label: `Collection ${index + 1}`,
      description: index % 2 === 0 ? 'AI curated' : 'Teammate curated',
    })),
    maxVisibleOptions: 5,
  },
};
