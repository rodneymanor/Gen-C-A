import { OnboardingFormState } from '../types/brandHub'

interface ContentPillar {
  title: string
  description: string
}

interface QaPrompt {
  question: string
  answer: string
}

interface IntentGuidance {
  intent: string
  guidance: string
}

const withFallback = (value: string, fallback: string) => value || fallback

export const buildContentPillars = (responses: OnboardingFormState): ContentPillar[] => {
  const whoAndWhat = withFallback(responses.whoAndWhat, 'your role and who you serve')
  const audienceProblem = withFallback(
    responses.audienceProblem,
    'the biggest challenge your audience is wrestling with'
  )
  const quickWin = withFallback(responses.quickWin, 'a quick win they crave')
  const bigDream = withFallback(responses.bigDream, 'the vision they want to step into')
  const voiceStyle = withFallback(responses.voiceStyle, 'your guiding style')
  const contentFocus = withFallback(responses.contentFocus, 'your core content pillars')

  return [
    {
      title: 'Momentum Builders',
      description: `Deliver bite-sized guidance that gives people ${quickWin} even on the busiest days.`
    },
    {
      title: 'Problem Solvers',
      description: `Bring your unique style (“${voiceStyle}”) into ${contentFocus} breakdowns that tackle ${audienceProblem} head-on.`
    },
    {
      title: 'Vision Casting',
      description: `Show how today’s message moves them from ${audienceProblem} toward ${bigDream} with ${whoAndWhat} leading the way.`
    }
  ]
}

export const buildQaPrompts = (responses: OnboardingFormState): QaPrompt[] => {
  const audienceProblem = withFallback(
    responses.audienceProblem,
    'the biggest challenge your audience is wrestling with'
  )
  const quickWin = withFallback(responses.quickWin, 'a quick win they crave')
  const bigDream = withFallback(responses.bigDream, 'the vision they want to step into')
  const contentFocus = withFallback(responses.contentFocus, 'your core content pillars')
  const voiceStyle = withFallback(responses.voiceStyle, 'your guiding style')

  return [
    {
      question: 'What belief are we reinforcing this week?',
      answer: `Remind listeners that even when ${audienceProblem}, small steps toward ${quickWin} keep momentum alive.`
    },
    {
      question: 'How do we invite them into the bigger vision?',
      answer: `Connect today’s takeaway to the ${bigDream} you’re championing and point them to next actions inside ${contentFocus}, delivered in that “${voiceStyle}” voice.`
    }
  ]
}

export const buildIntentPlaybook = (selectedIntents: string[]): IntentGuidance[] =>
  selectedIntents.map((intent) => {
    switch (intent) {
      case 'Educate':
        return {
          intent,
          guidance:
            'Show them the process. Use stepwise tutorials and annotated screen recordings to demystify your method.'
        }
      case 'Inspire':
        return {
          intent,
          guidance:
            'Spotlight transformation stories and personal reflections that humanize the journey and spark ambition.'
        }
      case 'Convert':
        return {
          intent,
          guidance:
            'Pair social proof with a clear next step. Close with "here is how to work with us" clarity every time.'
        }
      case 'Build community':
        return {
          intent,
          guidance:
            'Invite dialogue. Pose a thoughtful question and feature responses in next week’s recap clip.'
        }
      default:
        return {
          intent,
          guidance: 'Document the behind-the-scenes process and narrate why it matters right now.'
        }
    }
  })

export type { ContentPillar, IntentGuidance, QaPrompt }
