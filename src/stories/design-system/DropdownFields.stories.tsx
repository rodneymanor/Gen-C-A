import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';

import Select from '@atlaskit/select';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';

import '../../styles/tokens.css';
import '../../styles/globals.css';

type Option = {
  label: string;
  value: string;
  description?: string;
};

const selectStyles = {
  container: (base: any) => ({
    ...base,
    width: '100%',
  }),
  menuPortal: (base: any) => ({
    ...base,
    zIndex: 9999,
  }),
};

const meta = {
  title: 'Design System/Dropdowns',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: 420,
          padding: 'var(--space-8)',
          background: 'var(--color-neutral-50)',
          borderRadius: 'var(--radius-large)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const PersonaDropdownExample = () => {
  const personaOptions = useMemo<Option[]>(
    () => [
      {
        label: 'Creator Next Door',
        value: 'creator-next-door',
        description: 'Friendly, upbeat tone designed for TikTok intros.',
      },
      {
        label: 'Analyst Whisperer',
        value: 'analyst-whisperer',
        description: 'Data-first voice for thought leadership and breakdowns.',
      },
      {
        label: 'Hype Studio',
        value: 'hype-studio',
        description: 'High-energy narrative with punchy calls-to-action.',
      },
    ],
    []
  );

  const [selectedPersona, setSelectedPersona] = useState<Option | null>(personaOptions[0]);

  return (
    <Card appearance="subtle" spacing="comfortable">
      <CardHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-neutral-500)' }}>Brand voice</span>
          <h3 style={{ margin: 0 }}>Persona</h3>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label htmlFor="persona-select" style={{
              display: 'block',
              marginBottom: 'var(--space-2)',
              fontSize: 'var(--font-size-body-small)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-neutral-700)',
            }}>
              Persona
            </label>
            <Select
              inputId="persona-select"
              options={personaOptions}
              menuPortalTarget={document.body}
              styles={selectStyles}
              placeholder="Select a saved persona"
              value={selectedPersona}
              onChange={(option) => setSelectedPersona((option as Option) ?? null)}
              isClearable
            />
          </div>
          <div
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-medium)',
              background: 'var(--color-neutral-100)',
              color: 'var(--color-neutral-600)',
              fontSize: 'var(--font-size-body-small)',
            }}
          >
            {selectedPersona
              ? selectedPersona.description
              : 'Choose a brand voice to match tone and vocabulary across the generated script.'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SettingsDropdownExample = () => {
  const lengthOptions = useMemo<Option[]>(
    () => [
      { label: '15 seconds', value: '15s' },
      { label: '30 seconds', value: '30s' },
      { label: '45 seconds', value: '45s' },
      { label: '60 seconds', value: '60s' },
    ],
    []
  );

  const styleOptions = useMemo<Option[]>(
    () => [
      { label: 'Educational', value: 'educational' },
      { label: 'Story Driven', value: 'story' },
      { label: 'Product Spotlight', value: 'product' },
    ],
    []
  );

  const platformOptions = useMemo<Option[]>(
    () => [
      { label: 'TikTok', value: 'tiktok' },
      { label: 'Instagram Reels', value: 'instagram' },
      { label: 'YouTube Shorts', value: 'youtube' },
    ],
    []
  );

  const [length, setLength] = useState<Option | null>(lengthOptions[1]);
  const [style, setStyle] = useState<Option | null>(styleOptions[0]);
  const [platform, setPlatform] = useState<Option | null>(platformOptions[0]);

  return (
    <Card appearance="subtle" spacing="comfortable">
      <CardHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-neutral-500)' }}>AI settings</span>
          <h3 style={{ margin: 0 }}>Content preferences</h3>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label htmlFor="length-select" style={{
              display: 'block',
              marginBottom: 'var(--space-2)',
              fontSize: 'var(--font-size-body-small)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-neutral-700)',
            }}>
              Target length
            </label>
            <Select
              inputId="length-select"
              options={lengthOptions}
              value={length}
              onChange={(option) => setLength((option as Option) ?? null)}
              menuPortalTarget={document.body}
              styles={selectStyles}
              placeholder="Select clip length"
              isSearchable={false}
            />
          </div>
          <div>
            <label htmlFor="style-select" style={{
              display: 'block',
              marginBottom: 'var(--space-2)',
              fontSize: 'var(--font-size-body-small)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-neutral-700)',
            }}>
              Style
            </label>
            <Select
              inputId="style-select"
              options={styleOptions}
              value={style}
              onChange={(option) => setStyle((option as Option) ?? null)}
              menuPortalTarget={document.body}
              styles={selectStyles}
              placeholder="Select tone"
              isSearchable={false}
            />
          </div>
          <div>
            <label htmlFor="platform-select" style={{
              display: 'block',
              marginBottom: 'var(--space-2)',
              fontSize: 'var(--font-size-body-small)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-neutral-700)',
            }}>
              Platform
            </label>
            <Select
              inputId="platform-select"
              options={platformOptions}
              value={platform}
              onChange={(option) => setPlatform((option as Option) ?? null)}
              menuPortalTarget={document.body}
              styles={selectStyles}
              placeholder="Where will this publish?"
              isSearchable={false}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const PersonaDropdown: Story = {
  render: () => <PersonaDropdownExample />,
};

export const SettingsDropdowns: Story = {
  render: () => <SettingsDropdownExample />,
};
