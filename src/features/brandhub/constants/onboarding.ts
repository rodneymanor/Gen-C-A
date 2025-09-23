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
    prompt: 'What immediate impact would you like to have for your viewers?',
    helper: 'Example: “Help them leave with one actionable tip they can implement tonight.”'
  },
  {
    id: 'bigDream',
    title: 'Big Dream',
    prompt: 'What ultimate impact would you like to have?',
    helper: 'Example: “Redefine how busy parents see health so they build lifelong strength.”'
  },
  {
    id: 'voiceStyle',
    title: 'Your Style',
    prompt: "How would your customer's life change if they were able to successfully apply your recommendations?",
    helper: 'Example: “They’d wake up energized, feel confident in their skin, and trust their routine.”'
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
