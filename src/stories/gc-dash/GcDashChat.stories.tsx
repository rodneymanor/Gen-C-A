import type { Meta, StoryObj } from '@storybook/react';
import {
  GcDashChatComposer,
  GcDashChatThread,
  type GcDashChatMessage,
} from '../../components/gc-dash';

const sampleMessages: GcDashChatMessage[] = [
  {
    id: '1',
    author: 'assistant',
    name: 'Anthropic Copilot',
    timestamp: 'Today · 9:12 AM',
    content: (
      <p style={{ margin: 0 }}>
        I drafted the launch outline and recommended brand guardrails from the Anthropic kit. Let me know what to
        adjust.
      </p>
    ),
    status: 'sent',
  },
  {
    id: '2',
    author: 'user',
    name: 'Jordan Chen',
    timestamp: 'Today · 9:14 AM',
    content: (
      <p style={{ margin: 0 }}>
        Looks great. Could you pull in the customer story cards and prep a summary for the leadership sync?
      </p>
    ),
    status: 'read',
  },
  {
    id: '3',
    author: 'assistant',
    name: 'Anthropic Copilot',
    timestamp: 'Today · 9:15 AM',
    content: (
      <div style={{ display: 'grid', gap: 8 }}>
        <p style={{ margin: 0 }}>Here’s a three-point summary tailored for exec review:</p>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          <li>Roll-out progress and outstanding risks</li>
          <li>Customer pilot wins from Q3</li>
          <li>Next actions for policy & compliance</li>
        </ol>
      </div>
    ),
    status: 'sending',
  },
];

const meta: Meta<typeof GcDashChatThread> = {
  title: 'GC Dash/Conversation/Chat',
  component: GcDashChatThread,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Thread: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 24, height: '100%', padding: 32, background: 'var(--color-surface-subtle, #f4f5f7)' }}>
      <GcDashChatThread messages={sampleMessages} emptyState={<p>No conversations yet.</p>} style={{ minHeight: 420 }} />
      <GcDashChatComposer onSend={(value) => console.log({ value })} />
    </div>
  ),
};
