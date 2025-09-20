import { ApiBrandVoice, BrandVoice, ResolvedBrandVoice } from '../types/brandHub'

const parseDateLike = (value: unknown): Date | null => {
  if (!value) {
    return null
  }

  if (value instanceof Date) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  if (typeof value === 'number') {
    return new Date(value)
  }

  if (typeof value === 'object') {
    const maybeDate = value as { toDate?: () => Date; seconds?: number; nanoseconds?: number }
    if (typeof maybeDate.toDate === 'function') {
      try {
        return maybeDate.toDate()
      } catch (error) {
        console.warn('parseFirestoreDate: failed to convert via toDate()', error)
      }
    }

    if (typeof maybeDate.seconds === 'number') {
      const milliseconds = maybeDate.seconds * 1000 + (maybeDate.nanoseconds ?? 0) / 1_000_000
      return new Date(milliseconds)
    }
  }

  return null
}

const formatUpdatedLabel = (value: unknown): { label: string; sortTime: number } => {
  const date = parseDateLike(value)
  if (!date) {
    return { label: 'Updated recently', sortTime: 0 }
  }

  const now = Date.now()
  const diffMs = now - date.getTime()

  if (diffMs < 0) {
    return { label: 'Updated recently', sortTime: date.getTime() }
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  let label: string
  if (days === 0) {
    if (hours <= 0) {
      label = 'Updated just now'
    } else if (hours === 1) {
      label = 'Updated 1 hour ago'
    } else {
      label = `Updated ${hours} hours ago`
    }
  } else if (days === 1) {
    label = 'Updated 1 day ago'
  } else if (days < 7) {
    label = `Updated ${days} days ago`
  } else {
    label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  return { label, sortTime: date.getTime() }
}

const derivePillarsFromVoice = (voice: ApiBrandVoice): string[] => {
  if (Array.isArray(voice.keywords)) {
    const keywords = (voice.keywords as unknown[])
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    if (keywords.length > 0) {
      return keywords.slice(0, 4)
    }
  }

  if (typeof voice.tone === 'string' && voice.tone.trim().length > 0) {
    return [voice.tone.trim()]
  }

  return ['Templates ready']
}

export const mapApiBrandVoice = (voice: ApiBrandVoice): ResolvedBrandVoice => {
  const displayName = voice.name?.trim() || 'Brand voice workspace'
  const persona = voice.voice?.trim() || `${displayName} — Voice DNA`
  const summary = voice.description?.trim() || voice.voice?.trim() || 'Templates and tonal cues ready for script generation.'
  const platforms = Array.isArray(voice.platforms)
    ? (voice.platforms as unknown[]).filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []
  const platformLabel = platforms.length > 0 ? platforms.join(' · ') : 'Multi-platform'
  const audience = voice.targetAudience?.trim() || 'General audience'
  const { label: updatedLabel, sortTime } = formatUpdatedLabel(voice.created)
  const status: BrandVoice['status'] = voice.isDefault
    ? 'Live'
    : voice.isShared
      ? 'Exploring'
      : 'Draft'

  return {
    voice: {
      id: voice.id,
      name: displayName,
      status,
      persona,
      summary,
      platform: platformLabel,
      audience,
      lastUpdated: updatedLabel,
      pillars: derivePillarsFromVoice(voice)
    },
    sortTime
  }
}
