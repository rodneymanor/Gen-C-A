import { NormalizedHandleResult, PlatformType } from '../types/voiceWorkflow'

export const extractInstagramUsernameFromInput = (input: string): string | null => {
  const trimmed = input.trim()
  if (!trimmed) return null

  const clean = trimmed.replace(/^@/, '')

  if (/^https?:\/\//i.test(clean)) {
    try {
      const url = new URL(clean)
      if (!url.hostname.includes('instagram.com')) {
        return null
      }
      const pathParts = url.pathname.split('/').filter(Boolean)
      if (!pathParts.length) {
        return null
      }
      const candidate = pathParts[0].replace(/^@/, '').split(/[?#]/)[0]
      return /^[a-zA-Z0-9._]+$/.test(candidate) ? candidate : null
    } catch (error) {
      console.warn('Unable to parse Instagram URL', error)
      return null
    }
  }

  const username = clean.split(/[?#]/)[0]
  return /^[a-zA-Z0-9._]+$/.test(username) ? username : null
}

export const normalizeHandleInput = (input: string, platform: PlatformType): NormalizedHandleResult => {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new Error('Please enter a username or profile URL.')
  }

  if (platform === 'instagram') {
    const username = extractInstagramUsernameFromInput(trimmed)
    if (!username) {
      throw new Error('Unable to extract an Instagram username from the provided input.')
    }
    return { identifier: username, displayHandle: `@${username}` }
  }

  let working = trimmed
  if (/^https?:\/\//i.test(working)) {
    try {
      const url = new URL(working)
      if (url.hostname.includes('tiktok.com')) {
        const segments = url.pathname.split('/').filter(Boolean)
        const atHandle = segments.find((segment) => segment.startsWith('@'))
        if (atHandle) {
          working = atHandle.slice(1)
        } else if (segments.length) {
          working = segments[0]
        }
      }
    } catch (error) {
      console.warn('Unable to parse TikTok URL', error)
    }
  }

  working = working.replace(/^@/, '').split(/[/?#]/)[0]
  if (!working) {
    throw new Error('TikTok username could not be determined from the input.')
  }

  return { identifier: working, displayHandle: `@${working}` }
}
