import type { Meta, StoryObj } from '@storybook/react';
import {
  GcDashButton,
  GcDashProjectCard,
  GcDashProjectListItem,
  type GcDashProjectMember,
} from '../../components/gc-dash';

const members: GcDashProjectMember[] = [
  { name: 'Jordan Chen' },
  { name: 'Sky Patel' },
  { name: 'Lina Gomez' },
  { name: 'Casey Morgan' },
];

const meta: Meta<typeof GcDashProjectCard> = {
  title: 'GC Dash/Project/Components',
  component: GcDashProjectCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Card: Story = {
  render: () => (
    <GcDashProjectCard
      title="Anthropic GTM roll-out"
      description="Coordinate AI messaging guidelines, launch assets, and partner enablement."
      status="in-progress"
      dueDate="Sep 30, 2025"
      progress={68}
      members={members}
      tags={['enterprise', 'anthropic', 'marketing']}
    />
  ),
};

export const List: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 12, maxWidth: 880 }}>
      <GcDashProjectListItem
        name="AI onboarding refresh"
        owner="Jordan Chen"
        dueDate="Oct 4, 2025"
        status="in-progress"
        progress={54}
        assignees={members.slice(0, 3)}
        actions={<GcDashButton variant="ghost">Open</GcDashButton>}
        interactive
      />
      <GcDashProjectListItem
        name="Policy updates"
        owner="Lina Gomez"
        status="planning"
        progress={12}
        assignees={members.slice(1, 3)}
        actions={<GcDashButton variant="ghost">Share</GcDashButton>}
        interactive
      />
    </div>
  ),
};
