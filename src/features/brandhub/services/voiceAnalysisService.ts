import { VIDEO_LIMIT, ANALYSIS_MAX_TOKENS, ANALYSIS_MODEL, ANALYSIS_TEMPERATURE } from './voiceCreationConfig'
import { VoiceAnalysisResult } from '../types/voiceWorkflow'

const chunk = <T,>(arr: T[], size: number) => {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

const buildAnalysisPrompt = (batchTranscripts: string[]) => {
  const t = batchTranscripts
  const tCount = t.length
  const analysisInstruction = `Analyze these ${tCount} video transcripts and create reusable templates. For each transcript:\n\n1. EXTRACT THE SECTIONS:\n- Hook (first 3-5 seconds that grabs attention)\n- Bridge (transition that sets up the main content)\n- Golden Nugget (the main value/lesson/information)\n- Why to Act (the closing reason to take action)\n\n2. CREATE TEMPLATES from the hooks by replacing specific details with [VARIABLES]:\nExample: "I made $5000 in 2 days" → "I [achievement] in [timeframe]"\n\n3. DOCUMENT THE CREATOR'S STYLE:\n- Common words/phrases they repeat\n- Sentence length (short/long/mixed)\n- Transition words between sections\n- Speaking pace indicators (pauses, emphasis)\n\n${Array.from({ length: tCount }, (_, i) => `[INSERT TRANSCRIPT ${i + 1}]`).join('\n')}\n\nOUTPUT FORMAT:\n\n## HOOK TEMPLATES\n1. [Template with variables]\n2. [Template with variables]\n3. [Template with variables]\n\n## BRIDGE TEMPLATES\n1. [Template with variables]\n2. [Template with variables]\n\n## GOLDEN NUGGET STRUCTURE\n- How they present main points\n- Common frameworks used\n\n## WHY TO ACT TEMPLATES\n1. [Template with variables]\n2. [Template with variables]\n\n## STYLE SIGNATURE\n- Power words: [list]\n- Filler phrases: [list]\n- Transition phrases: [list]\n- Average words per sentence: [number]\n- Tone: [description]`

  const transcriptsBlock = t
    .map((content, i) => `\n[INSERT TRANSCRIPT ${i + 1}]\n${content ?? ''}`)
    .join('\n')

  const jsonHeader = `Return ONLY valid JSON with this schema and no markdown/code fences.\n\n{\n  "templates": {\n    "hooks": [{ "pattern": "string", "variables": ["string"], "sourceIndex": 1 }],\n    "bridges": [{ "pattern": "string", "variables": ["string"], "sourceIndex": 1 }],\n    "ctas": [{ "pattern": "string", "variables": ["string"], "sourceIndex": 1 }],\n    "nuggets": [{ "pattern": "string", "structure": "string", "variables": ["string"], "sourceIndex": 1 }]\n  },\n  "styleSignature": {\n    "powerWords": ["string"],\n    "fillerPhrases": ["string"],\n    "transitionPhrases": ["string"],\n    "avgWordsPerSentence": 0,\n    "tone": "string"\n  },\n  "transcripts": [{\n    "index": 1,\n    "hook": {"text": "string", "duration": 0, "type": "string", "emotionalTrigger": "string", "template": "string", "variables": {}},\n    "bridge": {"text": "string", "transitionType": "string", "duration": 0, "template": "string", "variables": {}},\n    "goldenNugget": {"text": "string", "valueType": "string", "deliveryMethod": "string", "duration": 0, "structure": "string", "keyPoints": ["string"], "template": "string", "variables": {}},\n    "cta": {"text": "string", "type": "string", "placement": "string", "urgency": "string", "template": "string", "variables": {}},\n    "microHooks": [{"text": "string", "position": 0, "purpose": "string", "template": "string", "variables": {}}]\n  }]\n}`

  const densityRequirement = `\n\nTEMPLATE DENSITY REQUIREMENTS:\n- Produce exactly ${tCount} items in each of templates.hooks, templates.bridges, templates.nuggets, templates.ctas.\n- Map one item per transcript and set sourceIndex to that transcript's index (1-based).\n- Do NOT deduplicate or merge similar templates across transcripts — include them separately even if identical.\n- Keep patterns generalized with [VARIABLES], but preserve distinct phrasing per transcript.`

  return `${jsonHeader}\n\n${analysisInstruction}${densityRequirement}\n${transcriptsBlock}`
}

const tryParseJson = (text: string): any | null => {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {}
  const cleaned = text.replace(/```[\s\S]*?```/g, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {}
  const first = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  if (first !== -1 && last !== -1 && last > first) {
    const slice = cleaned.substring(first, last + 1)
    try {
      return JSON.parse(slice)
    } catch {}
  }
  return null
}

const analyzeBatch = async (batchTranscripts: string[], retryCount = 0): Promise<any> => {
  const MAX_RETRIES = 2

  try {
    const composedPrompt = buildAnalysisPrompt(batchTranscripts)
    const response = await fetch('/api/voice/analyze-patterns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: composedPrompt,
        responseType: 'json',
        temperature: ANALYSIS_TEMPERATURE,
        maxTokens: ANALYSIS_MAX_TOKENS,
        model: ANALYSIS_MODEL,
        systemPrompt:
          'You are a strict JSON generator. Return ONLY valid JSON matching the schema. No markdown, no commentary, no code fences.'
      })
    })

    const result = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(result?.error || `API returned ${response.status}`)
    }

    const parsed = tryParseJson(result?.content || '')
    if (!parsed) {
      if (retryCount < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return analyzeBatch(batchTranscripts, retryCount + 1)
      }
      throw new Error('Failed to parse JSON content from analysis response.')
    }

    return parsed
  } catch (analysisError) {
    if (
      retryCount < MAX_RETRIES &&
      analysisError instanceof Error &&
      /(timeout|503|502)/i.test(analysisError.message)
    ) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      return analyzeBatch(batchTranscripts, retryCount + 1)
    }
    throw analysisError
  }
}

export const analyzeTranscripts = async (
  transcripts: string[]
): Promise<VoiceAnalysisResult> => {
  const allTranscripts = transcripts.slice(0, VIDEO_LIMIT)
  const batches = chunk(allTranscripts, 5)

  const batchResults: any[] = []
  for (let b = 0; b < batches.length; b += 1) {
    const r = await analyzeBatch(batches[b])
    if (!r) {
      throw new Error(`Analysis batch ${b + 1} returned empty results.`)
    }
    batchResults.push(r)
  }

  const combined: any = {
    templates: { hooks: [], bridges: [], ctas: [], nuggets: [] },
    styleSignature: {
      powerWords: [],
      fillerPhrases: [],
      transitionPhrases: [],
      avgWordsPerSentence: undefined,
      tone: 'Varied'
    },
    transcripts: []
  }

  const uniqPush = (arr: any[], items: any[]) => {
    const set = new Set(arr.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))))
    items.forEach((entry) => {
      const key = typeof entry === 'string' ? entry : JSON.stringify(entry)
      if (!set.has(key)) {
        set.add(key)
        arr.push(entry)
      }
    })
  }

  let globalOffset = 0
  for (let i = 0; i < batchResults.length; i += 1) {
    const r = batchResults[i]
    const bt = batches[i]
    const localCount = bt.length

    const adjustTemplates = (list: any[] = []) =>
      list.map((template: any, idx: number) => ({
        ...template,
        sourceIndex: globalOffset + (template?.sourceIndex ?? idx + 1)
      }))

    combined.templates.hooks.push(...adjustTemplates(r?.templates?.hooks))
    combined.templates.bridges.push(...adjustTemplates(r?.templates?.bridges))
    combined.templates.ctas.push(...adjustTemplates(r?.templates?.ctas))
    combined.templates.nuggets.push(...adjustTemplates(r?.templates?.nuggets))

    if (Array.isArray(r?.transcripts)) {
      combined.transcripts.push(
        ...r.transcripts.map((t: any, index: number) => ({
          ...t,
          index: globalOffset + (t?.index ?? index + 1)
        }))
      )
    }

    uniqPush(combined.styleSignature.powerWords, r?.styleSignature?.powerWords || [])
    uniqPush(combined.styleSignature.fillerPhrases, r?.styleSignature?.fillerPhrases || [])
    uniqPush(combined.styleSignature.transitionPhrases, r?.styleSignature?.transitionPhrases || [])

    const avg = r?.styleSignature?.avgWordsPerSentence
    if (typeof avg === 'number') {
      const current = combined.styleSignature.avgWordsPerSentence
      combined.styleSignature.avgWordsPerSentence =
        typeof current === 'number' ? (current + avg) / 2 : avg
    }

    if (r?.styleSignature?.tone && combined.styleSignature.tone === 'Varied') {
      combined.styleSignature.tone = r.styleSignature.tone
    }

    globalOffset += localCount
  }

  console.log('[BrandHub] Voice analysis ready', {
    transcripts: allTranscripts.length,
    hooks: combined?.templates?.hooks?.length ?? 0,
    bridges: combined?.templates?.bridges?.length ?? 0,
    ctas: combined?.templates?.ctas?.length ?? 0,
    nuggets: combined?.templates?.nuggets?.length ?? 0
  })

  return { raw: null, json: combined }
}
