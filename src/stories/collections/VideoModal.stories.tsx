import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { VideoModal } from '../../components/collections/VideoModal';
import type { ContentItem } from '../../types';
import { GcDashButton } from '../../components/gc-dash';

const now = new Date('2025-09-18T15:30:00Z');

const sampleVideos: ContentItem[] = [
  {
    id: 'gc-insights-hero',
    title: 'How Gen C Plans Content in 30 Minutes',
    description: 'A behind-the-scenes walkthrough of how creators are turning research drops into narrative-ready briefs.',
    type: 'video',
    platform: 'youtube',
    thumbnail: 'https://images.unsplash.com/photo-1522199997521-45e7c4b125c2?auto=format&fit=crop&w=800&q=80',
    url: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    duration: 186,
    wordCount: 0,
    tags: ['workflow', 'case-study', 'research'],
    creator: 'gen_c_team',
    created: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 6),
    updated: new Date(now.getTime() - 1000 * 60 * 60 * 12),
    status: 'published',
    metadata: {
      transcript:
        'Opening hook about the new planning ritual.\nBreakdown of the 5-minute research sprint.\nBridge into the storyboarding templates.\nGolden nugget: “We ship twice as fast by splitting curiosity from craft.”\nCall to action inviting teams into the next live build.',
      scriptComponents: [
        { id: 'hook', type: 'hook', label: 'Cold open hook', content: 'We plan a month of content in under 30 minutes—here is how.' },
        { id: 'bridge', type: 'bridge', label: 'Credibility bridge', content: 'Gen C creators tested the ritual on 42 campaigns and doubled delivery speed.' },
        { id: 'golden', type: 'golden_nugget', label: 'Golden nugget', content: 'Split curiosity from craft: research fast, then storyboard to unlock depth on demand.' },
        { id: 'cta', type: 'call_to_action', label: 'Call to action', content: 'Join the sprint room this Thursday and build your first adaptive briefing board with us.' },
      ],
      analysis: {
        performance: {
          readability: 8.6,
          engagement: 7.9,
          hookStrength: 9.4,
        },
      },
      views: 184532,
      likes: 12842,
      comments: 214,
      shares: 96,
      saves: 463,
    },
  },
  {
    id: 'gc-voice-lab',
    title: 'Voice Lab: Turning Raw Interviews into Scripts',
    description: 'A live transformation of a 15-minute founder interview into a punchy cross-platform script set.',
    type: 'video',
    platform: 'linkedin',
    thumbnail: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration: 214,
    wordCount: 0,
    tags: ['ai', 'scripts', 'voice'],
    creator: 'studio_lead',
    created: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 12),
    updated: new Date(now.getTime() - 1000 * 60 * 60 * 36),
    status: 'published',
    metadata: {
      transcript:
        'Welcome back to Voice Lab. Today we are converting a raw founder interview into three punchy scripts.\nHook: The founder drops the single sentence that convinced investors.\nBridge: We map the emotional arc to audience insight.\nCTA: Grab the restructure template and remix your own interviews before Friday.',
      scriptComponents: [
        { id: 'hook-1', type: 'hook', label: 'Investor hook', content: 'Investors said yes at 17 minutes—here is the sentence that flipped the room.' },
        { id: 'bridge-1', type: 'bridge', label: 'Audience bridge', content: 'We mapped the emotional arc to the three objections the market keeps raising.' },
        { id: 'cta-1', type: 'call_to_action', label: 'Template CTA', content: 'Download the restructure template and remake your own interview narrative before Friday.' },
      ],
      analysis: {
        performance: {
          readability: 8.1,
          engagement: 8.4,
          hookStrength: 8.9,
        },
      },
      views: 98542,
      likes: 7421,
      comments: 168,
      shares: 64,
      saves: 382,
    },
  },
  {
    id: 'gc-sprint-teaser',
    title: 'Sprint Room Teaser: 4 Hooks in 4 Minutes',
    description: 'Quick teaser showing how teams remix hooks using the Sprint Room canvas.',
    type: 'video',
    platform: 'tiktok',
    thumbnail: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=800&q=80',
    url: 'https://www.tiktok.com/@genc/video/742839201923',
    duration: 62,
    wordCount: 0,
    tags: ['sprint-room', 'teaser'],
    creator: 'motion_cell',
    created: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3),
    updated: new Date(now.getTime() - 1000 * 60 * 60 * 6),
    status: 'draft',
    metadata: {
      rawSource: {
        transcript: 'We asked the Sprint Room to drop four hooks in four minutes—here is the chaos.\nHook 1: Flip the obvious assumption.\nHook 2: Start with the sound.\nHook 3: Run the numbers and let the insight land.\nHook 4: Throw them into the moment before the reveal.',
      },
      scriptComponents: [
        { id: 'teaser-hook', type: 'hook', label: 'Teaser hook', content: 'Four hooks, four minutes—watch how Sprint Room keeps voice and velocity aligned.' },
        { id: 'teaser-golden', type: 'golden_nugget', label: 'Hook remix', content: 'You remix a single insight into four formats to test resonance without rewriting the story.' },
      ],
      analysis: {
        performance: {
          readability: 7.4,
          engagement: 7.1,
          hookStrength: 9.1,
        },
      },
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
    },
  },
];

const meta: Meta<typeof VideoModal> = {
  title: 'Collections/Video Modal',
  component: VideoModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'light',
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const VideoModalShowcase = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [index, setIndex] = useState(0);

  const orderedVideos = useMemo(() => sampleVideos, []);
  const activeVideo = isOpen ? orderedVideos[index] : null;

  const handleNavigateVideo = (direction: 'prev' | 'next') => {
    setIndex((prev) => {
      if (direction === 'prev') {
        return Math.max(0, prev - 1);
      }
      return Math.min(orderedVideos.length - 1, prev + 1);
    });
    setIsOpen(true);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at top left, rgba(11,92,255,0.14), rgba(9,30,66,0.05))',
        padding: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'grid',
          gap: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <GcDashButton onClick={() => setIsOpen(true)} variant="primary">
            Open redesigned video modal
          </GcDashButton>
          <GcDashButton
            variant="ghost"
            onClick={() => setIndex((prev) => (prev + 1) % orderedVideos.length)}
          >
            Cycle sample video
          </GcDashButton>
        </div>
      </div>

      <VideoModal
        isOpen={isOpen}
        video={activeVideo}
        videos={orderedVideos}
        onClose={() => setIsOpen(false)}
        onNavigateVideo={handleNavigateVideo}
      />
    </div>
  );
};

export const RedesignedModal: Story = {
  name: 'Redesigned Modal',
  render: () => <VideoModalShowcase />,
};
