import type { Meta, StoryObj } from '@storybook/react'
import { ViralClipCard } from '../features/viral-content/components/ViralClipCard'
import type { ViralVideo } from '../features/viral-content/types'

const logAction =
  (label: string) =>
  (...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.log(`[Storybook:${label}]`, ...args)
  }

const sampleVideo: ViralVideo = {
  id: 'sample-clip',
  platform: 'instagram',
  creator: '@moicareofficial',
  title: 'Sample vertical video',
  description: 'Stop standardising beauty—show up glowing in your own skin and own the camera.',
  thumbnail:
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
  url: '#',
  views: '391K views',
  publishedAt: '5 hours ago',
  type: 'short',
  metrics: [
    { id: 'velocity', label: 'Velocity', value: '5.9x', tone: 'success' },
    { id: 'views', label: 'Views', value: '391K', tone: 'primary' },
    { id: 'save-rate', label: 'Save rate', value: '6%', tone: 'warning' }
  ]
}

const meta: Meta<typeof ViralClipCard> = {
  title: 'Features/Viral Content/ViralClipCard',
  component: ViralClipCard,
  parameters: {
    layout: 'centered'
  },
  args: {
    onOpen: logAction('open'),
    onViewInsights: logAction('view-insights'),
    onAddToProject: logAction('add-to-project'),
    onPlay: logAction('play'),
    video: sampleVideo
  }
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const TikTokExample: Story = {
  args: {
    video: {
      ...sampleVideo,
      id: 'tiktok-clip',
      platform: 'tiktok',
      creator: '@creator_society',
      thumbnail:
        'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
      description:
        'Caption formula that keeps viewers glued — tension, proof, CTA. Try it in your next short.',
      metrics: [
        { id: 'hook', label: 'Hook score', value: '4.8x', tone: 'success' },
        { id: 'watch', label: 'Watch %', value: '88%', tone: 'primary' },
        { id: 'shares', label: 'Shares', value: '18K', tone: 'success' }
      ]
    }
  }
}
