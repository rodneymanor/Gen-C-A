import type { Meta, StoryObj } from '@storybook/react';
import {
  GcDashCheckbox,
  GcDashFormField,
  GcDashInput,
  GcDashRadio,
  GcDashSelect,
  GcDashTextArea,
  GcDashToggle,
  type GcDashSelectOption,
} from '../../components/gc-dash';

const options: GcDashSelectOption[] = [
  { value: 'brand', label: 'Brand kit' },
  { value: 'launch', label: 'Product launch' },
  { value: 'copy', label: 'Copy review' },
];

const meta: Meta<typeof GcDashFormField> = {
  title: 'GC Dash/Form/Elements',
  component: GcDashFormField,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '24px', maxWidth: 640 }}>
      <GcDashFormField label="Project name" hint="Use something teammates will recognize." required labelFor="project-name">
        <GcDashInput id="project-name" placeholder="AI-first launch" />
      </GcDashFormField>
      <GcDashFormField
        label="Project summary"
        description="Provide high-level context for collaborators."
        labelFor="project-summary"
      >
        <GcDashTextArea id="project-summary" placeholder="Share the vision, scope, and success metrics." rows={4} />
      </GcDashFormField>
      <GcDashFormField label="Workflow" labelFor="project-workflow">
        <GcDashSelect id="project-workflow" options={options} defaultValue={options[0]!.value} />
      </GcDashFormField>
      <div style={{ display: 'grid', gap: 16 }}>
        <GcDashCheckbox defaultChecked label="Enable async updates" description="Keep the team in sync automatically." />
        <GcDashRadio name="channel" defaultChecked label="Ask Anthropic" description="Route questions to AI" value="ai" />
        <GcDashRadio name="channel" label="Ask teammate" value="human" />
        <GcDashToggle defaultChecked label="Notify me" description="Send push notifications for new activity." />
      </div>
    </div>
  ),
};

export const Tones: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, maxWidth: 420 }}>
      <GcDashInput tone="default" placeholder="Default tone" />
      <GcDashInput tone="success" placeholder="Success tone" />
      <GcDashInput tone="warning" placeholder="Warning tone" />
      <GcDashInput tone="error" placeholder="Error tone" />
    </div>
  ),
};
