import type { Meta, StoryObj } from '@storybook/react';
import AddIcon from '@atlaskit/icon/glyph/add';
import RefreshIcon from '@atlaskit/icon/glyph/refresh';

import {
  GcDashButton,
  GcDashHeader,
  GcDashHeaderSearchInput,
  GcDashNavButtons,
  GcDashPlanChip,
} from '../../components/gc-dash';

const meta: Meta<typeof GcDashHeader> = {
  title: 'GC Dash/Header',
  component: GcDashHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <GcDashHeader
      leading={
        <>
          <GcDashPlanChip planName="Creator cockpit" info="Today" highlighted />
          <GcDashNavButtons />
        </>
      }
      actions={
        <GcDashButton variant="primary" leadingIcon={<AddIcon label="" />}>
          New script
        </GcDashButton>
      }
    />
  ),
};

export const WithSearchInput: Story = {
  render: () => (
    <GcDashHeader
      leading={
        <>
          <GcDashPlanChip planName="Content library" info="Search all assets" highlighted />
          <GcDashNavButtons />
        </>
      }
      search={
        <GcDashHeaderSearchInput
          placeholder="Search creators, hooks, formats"
          ariaLabel="Search the content library"
          size="medium"
          onSearch={(value) => console.log('Search', value)}
        />
      }
      actions={
        <>
          <GcDashButton variant="ghost" size="small" leadingIcon={<RefreshIcon label="" />}>
            Refresh
          </GcDashButton>
          <GcDashButton variant="primary" size="small" leadingIcon={<AddIcon label="" />}>
            New script
          </GcDashButton>
        </>
      }
    />
  ),
};
