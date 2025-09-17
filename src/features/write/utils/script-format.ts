import { parseInlineLabels, type ScriptElements } from '@/lib/script-analysis'

export interface ScriptComponents {
  hook: string
  bridge: string
  goldenNugget: string
  wta: string
}

export const composeScriptContent = (components: ScriptComponents): string => {
  return `[HOOK - First 3 seconds]\n${components.hook || ''}\n\n[BRIDGE - Transition]\n${components.bridge || ''}\n\n[GOLDEN NUGGET - Main Value]\n${components.goldenNugget || ''}\n\n[WTA - Call to Action]\n${components.wta || ''}`
}

const doubleSpaceSentences = (text: string) =>
  text
    .replace(/\r?\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/([.!?])\s+/g, '$1\n\n')
    .trim()

export const formatScriptElementsToContent = (elements: ScriptElements): string => {
  const sections = [
    elements.hook ? doubleSpaceSentences(elements.hook) : '',
    elements.bridge ? doubleSpaceSentences(elements.bridge) : '',
    elements.goldenNugget ? doubleSpaceSentences(elements.goldenNugget) : '',
    elements.wta ? doubleSpaceSentences(elements.wta) : ''
  ].filter(Boolean)

  return sections.join('\n\n')
}

export const deriveScriptElementsFromContent = (content: string): ScriptElements => {
  return parseInlineLabels(content)
}
