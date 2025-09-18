import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from '@/components/ui/Input';
import SearchIcon from '@atlaskit/icon/glyph/search';
import CrossIcon from '@atlaskit/icon/glyph/cross';

import '../../styles/tokens.css';
import '../../styles/globals.css';

const meta = {
  title: 'Design System/Input Fields',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: 360,
          padding: 'var(--space-6)',
          background: 'var(--color-neutral-0)',
          borderRadius: 'var(--radius-large)',
          boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)',
        }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    label: 'Field label',
    placeholder: 'Type something...',
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithHelperText: Story = {
  args: {
    helperText: 'Explain what information belongs in this field.',
  },
};

export const WithError: Story = {
  args: {
    errorMessage: 'We need a value before you can continue.',
  },
};

export const WithIcons: Story = {
  render: (args) => (
    <Input
      {...args}
      iconBefore={<SearchIcon label="Search" size="small" />}
      iconAfter={<CrossIcon label="Clear" size="small" />}
    />
  ),
  args: {
    label: 'Search creators',
    placeholder: 'Search by name or handle',
  },
};

export const WithCharacterCount: Story = {
  args: {
    showCharacterCount: true,
    maxLength: 100,
    helperText: 'Keep your description short and descriptive.',
  },
};
