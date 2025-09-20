import { OnboardingFormState, OnboardingPrompt } from '../types/brandHub'

export const onboardingPrompts: OnboardingPrompt[] = [
  {
    id: 'whoAndWhat',
    title: 'Who & What',
    prompt: 'What do you do and who do you help?',
    helper: 'Example: “I’m a fitness coach who helps busy moms get strong.”'
  },
  {
    id: 'audienceProblem',
    title: 'The Problem',
    prompt: "What's the #1 problem your audience is struggling with right now?",
    helper: 'Example: “They want to work out but can’t find time with kids around.”'
  },
  {
    id: 'quickWin',
    title: 'Quick Win',
    prompt: "What's the first small win they're looking for?",
    helper: 'Example: “Just 10 minutes a day where they feel like themselves again.”'
  },
  {
    id: 'bigDream',
    title: 'Big Dream',
    prompt: 'If they could wave a magic wand, what would their life look like in 1 year?',
    helper: 'Example: “They’d have energy to play with kids and feel confident in their body.”'
  },
  {
    id: 'voiceStyle',
    title: 'Your Style',
    prompt: 'Are you the tough coach, the supportive friend, or the wise teacher?',
    helper: 'Example: “I’m the supportive friend who’s been there and gets it.”'
  },
  {
    id: 'contentFocus',
    title: 'Content Focus',
    prompt: "What are the 3 main things you'll teach or share about?",
    helper: 'Example: “Quick workouts, meal prep hacks, and mindset shifts for moms.”'
  }
]

export const defaultIntentSelection = ['Educate', 'Inspire'] as const

export const intentOptions = ['Educate', 'Inspire', 'Convert', 'Build community'] as const

export const createEmptyOnboardingResponses = (): OnboardingFormState => ({
  whoAndWhat: '',
  audienceProblem: '',
  quickWin: '',
  bigDream: '',
  voiceStyle: '',
  contentFocus: ''
})
