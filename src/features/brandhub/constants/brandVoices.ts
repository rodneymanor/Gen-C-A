import { CreatorVideo } from '../types/brandHub'

export const platformOptions = ['TikTok', 'Instagram', 'YouTube Shorts'] as const

export const mockVideos: CreatorVideo[] = [
  {
    id: 'video-1',
    title: 'How I storyboard a 60-second launch video',
    duration: '1:12',
    performance: '54K views · 7.2% watch through',
    postedAt: '3 days ago'
  },
  {
    id: 'video-2',
    title: 'This hook consistently adds 15% more watch time',
    duration: '0:48',
    performance: '42K views · 6.4% watch through',
    postedAt: '5 days ago'
  },
  {
    id: 'video-3',
    title: 'What I look for in a creator partnership brief',
    duration: '1:26',
    performance: '37K views · 5.1% watch through',
    postedAt: '1 week ago'
  },
  {
    id: 'video-4',
    title: 'The 15-minute voice warm up before I hit record',
    duration: '0:52',
    performance: '39K views · 6.9% watch through',
    postedAt: '2 weeks ago'
  }
]
