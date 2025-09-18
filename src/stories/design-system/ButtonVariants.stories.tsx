import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ButtonProps } from '@/components/ui/Button';

import AddIcon from '@atlaskit/icon/glyph/add';
import EditIcon from '@atlaskit/icon/glyph/edit';
import TrashIcon from '@atlaskit/icon/glyph/trash';
import ArrowRightIcon from '@atlaskit/icon/glyph/arrow-right';

import { Button } from '@/components/ui/Button';

import '../../styles/tokens.css';
import '../../styles/globals.css';

const meta = {
  title: 'Design System/Buttons',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  args: {
    children: 'Click me',
    variant: 'primary',
    size: 'medium',
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const variantLabels: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  tertiary: 'Tertiary',
  destructive: 'Destructive',
  'ai-powered': 'AI Powered',
  creative: 'Creative',
  subtle: 'Subtle',
  warning: 'Warning',
  danger: 'Danger',
  'ppx-primary': 'Perplexity Primary',
  soft: 'Soft',
};

const variants: Array<NonNullable<ButtonProps['variant']>> = [
  'primary',
  'secondary',
  'tertiary',
  'destructive',
  'ai-powered',
  'creative',
  'subtle',
  'soft',
  'warning',
  'danger',
  'ppx-primary',
];

export const VariantsShowcase: Story = {
  args: {},
  render: () => (
    <div
      style={{
        display: 'grid',
        gap: 'var(--space-6)',
        width: 560,
      }}
    >
      {variants.map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--font-size-body-small)', color: 'var(--color-neutral-600)' }}>
            {variantLabels[variant]}
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button variant={variant}>Default</Button>
            <Button variant={variant} isDisabled>
              Disabled
            </Button>
            <Button variant={variant} isLoading>
              Loading
            </Button>
          </div>
        </div>
      ))}
    </div>
  ),
};

const sizes: Array<NonNullable<ButtonProps['size']>> = ['small', 'medium', 'large'];

export const SizeComparison: Story = {
  args: {},
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: 320 }}>
      {sizes.map((size) => (
        <div key={size} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ width: 80, fontSize: 'var(--font-size-body-small)', color: 'var(--color-neutral-600)' }}>
            {size.charAt(0).toUpperCase() + size.slice(1)}
          </span>
          <Button size={size}>Button</Button>
        </div>
      ))}
    </div>
  ),
};

export const IconButtons: Story = {
  args: {},
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: 480 }}>
      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <span style={{ fontSize: 'var(--font-size-body-small)', color: 'var(--color-neutral-600)' }}>
          Icon placement
        </span>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button variant="primary" iconBefore={<AddIcon label="Add" />}>
            New project
          </Button>
          <Button variant="secondary" iconAfter={<ArrowRightIcon label="Continue" />}>
            Continue
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <span style={{ fontSize: 'var(--font-size-body-small)', color: 'var(--color-neutral-600)' }}>
          Icon-only actions
        </span>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            iconBefore={<EditIcon label="Edit" />}
            aria-label="Edit"
          />
          <Button
            variant="danger"
            iconBefore={<TrashIcon label="Delete" />}
            aria-label="Delete"
          />
          <Button
            variant="soft"
            size="small"
            iconBefore={<AddIcon label="Add" />}
            aria-label="Add item"
          />
        </div>
      </div>
    </div>
  ),
};
