import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import {
  GcDashCollectionGrid,
  GcDashCreatorGrid,
  GcDashGridType,
  GcDashVideoGrid,
  GcDashVideoGridControls,
  GcDashVideoGridSlideout,
} from '../../components/gc-dash';
import {
  sampleVideos,
  sampleCollections,
  sampleCreators,
} from '../../lib/data/sample-video-grid';

const meta: Meta<typeof GcDashVideoGrid> = {
  title: 'GC Dash/Video Grid',
  component: GcDashVideoGrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => {
    const [gridType, setGridType] = useState<GcDashGridType>('videos');
    const [columns, setColumns] = useState<1 | 2 | 3 | 4 | 5 | 6>(3);
    const [slideoutOpen, setSlideoutOpen] = useState(true);

    const gridContent = useMemo(() => {
      switch (gridType) {
        case 'collections':
          return (
            <GcDashCollectionGrid
              collections={sampleCollections}
              columns={columns}
              onCollectionClick={(collection) => console.log('Collection selected', collection)}
            />
          );
        case 'creators':
          return (
            <GcDashCreatorGrid
              creators={sampleCreators}
              columns={columns}
              onCreatorClick={(creator) => console.log('Creator selected', creator)}
            />
          );
        default:
          return (
            <GcDashVideoGrid
              videos={sampleVideos}
              columns={columns}
              onVideoClick={(video) => console.log('Video clicked', video)}
              onVideoSelect={(video) => console.log('Video focused', video)}
            />
          );
      }
    }, [gridType, columns]);

    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'rgba(9, 30, 66, 0.04)',
          padding: '48px 56px',
          display: 'grid',
          gap: '32px',
        }}
      >
        <GcDashVideoGridControls
          columns={columns}
          onColumnsChange={setColumns}
          slideoutOpen={slideoutOpen}
          onSlideoutToggle={() => setSlideoutOpen((open) => !open)}
          gridType={gridType}
          onGridTypeChange={setGridType}
        />

        <div
          style={{
            display: 'grid',
            gap: '24px',
            gridTemplateColumns: 'minmax(0, 1fr)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gap: '24px',
              gridTemplateColumns: slideoutOpen ? 'minmax(0, 2.25fr) minmax(320px, 1fr)' : 'minmax(0, 1fr)',
            }}
          >
            <div>{gridContent}</div>
            {slideoutOpen ? (
              <GcDashVideoGridSlideout isOpen={slideoutOpen} columns={columns}>
                <div
                  style={{
                    display: 'grid',
                    gap: 12,
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(11, 92, 255, 0.06)',
                    color: 'rgba(9, 30, 66, 0.85)',
                  }}
                >
                  <strong>Keyboard tips</strong>
                  <span>Use arrow keys to move focus across the grid.</span>
                  <span>Press Enter or Space to activate the focused item.</span>
                </div>
              </GcDashVideoGridSlideout>
            ) : null}
          </div>
        </div>
      </div>
    );
  },
};
