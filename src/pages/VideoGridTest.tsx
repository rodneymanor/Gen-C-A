import React from 'react';
import { css } from '@emotion/react';

import {
  GcDashHeader,
  GcDashVideoGrid,
  GcDashVideoGridControls,
  GcDashVideoGridSlideout,
  GcDashCollectionGrid,
  GcDashCreatorGrid,
  GcDashGridType,
} from '@/components/gc-dash';
import { sampleVideos, sampleCollections, sampleCreators } from '@/lib/data/sample-video-grid';

const pageStyles = css`
  display: grid;
  gap: 32px;
  padding: 48px 48px 64px;
`;

const layoutStyles = css`
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(0, 1fr);
`;

const gridShellStyles = css`
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(0, 2.25fr) minmax(320px, 1fr);

  @media (max-width: 1200px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const VideoGridTest: React.FC = () => {
  const [gridType, setGridType] = React.useState<GcDashGridType>('videos');
  const [columns, setColumns] = React.useState<1 | 2 | 3 | 4 | 5 | 6>(3);
  const [slideoutOpen, setSlideoutOpen] = React.useState(true);

  const gridContent = React.useMemo(() => {
    switch (gridType) {
      case 'collections':
        return (
          <GcDashCollectionGrid
            collections={sampleCollections}
            columns={columns}
            onCollectionClick={(collection) => console.log('Clicked collection', collection)}
          />
        );
      case 'creators':
        return (
          <GcDashCreatorGrid
            creators={sampleCreators}
            columns={columns}
            onCreatorClick={(creator) => console.log('Clicked creator', creator)}
          />
        );
      default:
        return (
          <GcDashVideoGrid
            videos={sampleVideos}
            columns={columns}
            onVideoClick={(video) => console.log('Clicked video', video)}
            onVideoSelect={(video) => console.log('Focused video', video)}
          />
        );
    }
  }, [gridType, columns]);

  return (
    <div css={pageStyles}>
      <GcDashHeader
        leading={<span style={{ fontSize: 20, fontWeight: 600 }}>GC Dash Video Grid Test</span>}
        actions={null}
      />

      <div css={layoutStyles}>
        <GcDashVideoGridControls
          columns={columns}
          onColumnsChange={setColumns}
          slideoutOpen={slideoutOpen}
          onSlideoutToggle={() => setSlideoutOpen((prev) => !prev)}
          gridType={gridType}
          onGridTypeChange={setGridType}
        />

        <div css={gridShellStyles}>
          <div>{gridContent}</div>
          {slideoutOpen ? (
            <GcDashVideoGridSlideout isOpen={slideoutOpen} columns={columns}>
              <div
                style={{
                  display: 'grid',
                  gap: 12,
                  padding: 12,
                  borderRadius: 12,
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
};

export default VideoGridTest;
