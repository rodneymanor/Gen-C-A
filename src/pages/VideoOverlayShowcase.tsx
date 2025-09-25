import React, { useState } from 'react';
import { css } from '@emotion/react';
import { GcDashButton, GcDashCard, GcDashCardBody, GcDashCardTitle, GcDashCardSubtitle } from '../components/gc-dash';
import type { ContentItem } from '../types';
import { VideoInsightsOverlay } from '../components/collections';
import type { VideoOverlayAnalysis, VideoOverlayMetric } from '../components/collections';

const pageStyles = css`
  padding: var(--space-7);
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);

  h1 {
    font-size: 28px;
    font-weight: 650;
    margin: 0;
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
  }
`;

const metrics: VideoOverlayMetric[] = [
  { id: 'creatorScore', label: 'Creator score', value: '5.8K', helper: 'Composite score (P75 of niche)' },
  { id: 'engagement', label: 'Engagement rate', value: '5%', helper: 'Likes + comments per view', trend: 'up' },
  { id: 'views', label: 'Views', value: '39K', helper: 'Lifetime views across platforms' },
  { id: 'likes', label: 'Likes', value: '18K', helper: 'Total positive reactions' },
  { id: 'comments', label: 'Comments', value: '52', helper: 'Number of responses' },
  { id: 'followers', label: 'Channel followers', value: '89K', helper: 'Current audience size' },
];

const analysis: VideoOverlayAnalysis = {
  hook: {
    openerPattern: 'Starts with a direct question that calls out prevailing beauty standards to immediately frame the narrative.',
    frameworks: [
      '“Can you believe X is doing Y?”',
      '“Why is X doing Y to accomplish Z?”',
    ],
    justification: 'Transcript opens with a bold rhetorical question that challenges the viewer, a hallmark of the Question-style hook.',
  },
  structure: {
    type: 'Educational Motivation',
    description: 'A persuasive share-out that mixes personal conviction with practical encouragement.',
    bestFor: ['Success stories', 'Motivational content', 'Personal development'],
    justification: 'Short runtime with declarative statements that rally viewers, aligning with motivational explainer formats.',
  },
  style: {
    tone: 'Direct, matter-of-fact with confident reassurance.',
    voice: 'Thoughtful narrator speaking from lived experience to empower the audience.',
    wordChoice: 'Everyday language with bold adjectives highlighting self-worth.',
    pacing: 'Rapid-fire delivery and minimal pausing to sustain urgency.',
  },
};

const sampleVideo: ContentItem & { metrics: VideoOverlayMetric[]; analysis: VideoOverlayAnalysis; transcript: string } = {
  id: 'sample-video-01',
  title: 'Stop standarin kulit putih kecantikan di negara ini 🟡 Tan / dark skin? Gorgeous banget! Semua berhak cantik dengan…',
  description:
    'Stop standarin kulit putih kecantikan di negara ini 🟡 Tan / dark skin? Gorgeous banget! Semua berhak cantik dengan warna kulit masing-masing. Asal terawat, cerah, dan glowing! ✨',
  type: 'video',
  platform: 'tiktok',
  thumbnail: 'https://via.placeholder.com/320x480?text=Video+Thumbnail',
  url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  duration: 42,
  tags: ['beauty', 'melanin', 'self-love'],
  creator: '@glownation.id',
  created: new Date('2024-08-12T10:15:00Z'),
  updated: new Date('2024-09-01T15:45:00Z'),
  status: 'published',
  metadata: { views: 39000, likes: 18000, comments: 52, followers: 89000 },
  metrics,
  analysis,
  transcript: 'We. Semua berhak glowing dengan warna kulit masing-masing, jadi jangan biarin standar lama ngatur cantik versi kamu. Rawat yang kamu punya dan jadikan itu superpower.',
};

export const VideoOverlayShowcase: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div css={pageStyles}>
      <div>
        <h1>Video Insights Overlay</h1>
        <p>Preview the new GC Dash overlay for learning from viral clips and collection videos.</p>
      </div>

      <GcDashCard>
        <GcDashCardBody>
          <GcDashCardTitle>How to use</GcDashCardTitle>
          <GcDashCardSubtitle>
            Click the button below to launch the overlay. The content mirrors the analysis from our design brief.
          </GcDashCardSubtitle>
          <GcDashButton variant="primary" size="medium" onClick={() => setIsOpen(true)}>
            Launch overlay
          </GcDashButton>
        </GcDashCardBody>
      </GcDashCard>

      <VideoInsightsOverlay open={isOpen} onClose={() => setIsOpen(false)} video={sampleVideo} />
    </div>
  );
};

export default VideoOverlayShowcase;
