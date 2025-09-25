import type { Meta, StoryObj } from '@storybook/react';
import { GcDashButton, type GcDashButtonProps } from '../../components/gc-dash';

const meta: Meta<typeof GcDashButton> = {
  title: 'GC Dash/Actions/Button',
  component: GcDashButton,
  tags: ['autodocs'],
  args: {
    children: 'Create project',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger', 'link'],
    },
    size: {
      control: 'inline-radio',
      options: ['small', 'medium', 'large'],
    },
    isLoading: {
      control: 'boolean',
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Delete workspace',
  },
};

export const WithIcons: Story = {
  args: {
    variant: 'primary',
    leadingIcon: '✨',
    trailingIcon: '→',
  } satisfies GcDashButtonProps,
};

export const Loading: Story = {
  args: {
    variant: 'primary',
    isLoading: true,
    children: 'Generating…',
  },
};

export const FullWidth: Story = {
  args: {
    variant: 'secondary',
    fullWidth: true,
    children: 'Invite collaborators',
  },
  parameters: {
    layout: 'padded',
  },
};
