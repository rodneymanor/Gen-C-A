import type { VercelRequest, VercelResponse } from '@vercel/node';

interface AIActionRequest {
  actionType: string;
  text: string;
  option?: string;
  sectionType?: string;
}

// Section-specific writing guardrails to keep actions contextual
const SECTION_GUIDELINES: Record<string, string> = {
  hook: [
    'One punchy sentence; 7–14 words when possible.',
    'Lead with tension, surprise, or a bold claim you can support.',
    'Avoid hashtags and clickbait; 0–1 emoji max.'
  ].join(' '),
  'micro-hook': [
    'Ultra tight; 4–10 words only.',
    'Clear, bold, skimmable; no fluff or setup.'
  ].join(' '),
  bridge: [
    '1–2 short sentences that connect hook to value.',
    'Use simple connectors (so, but, because).',
    'Create momentum; do not teach steps here.'
  ].join(' '),
  nugget: [
    'Keep the core insight clear and concrete.',
    'Prefer 1–3 crisp sentences; high signal-only.'
  ].join(' '),
  cta: [
    'Direct, low-friction ask with clear next step.',
    'Avoid vague “like/subscribe”; be specific and ethical.'
  ].join(' ')
};

// Action prompt templates. Placeholders: {sectionType}, {text}, {option}, {sectionGuidelines}
const ACTION_PROMPTS: Record<string, string> = {
  simplify: [
    'You are a precise script editor. Rewrite the user\'s {sectionType} to be simpler and clearer while preserving meaning and intent.',
    'Constraints: grade 6–8 reading level, short sentences, no jargon/filler, same perspective and tone.',
    'Do not add new claims or examples. Output only the rewritten {sectionType}.',
    'Source text:\n{\n{text}\n}',
    'Section guidelines: {sectionGuidelines}'
  ].join('\n\n'),

  generate_variations: [
    'Generate exactly 10 distinct {sectionType} variations based on the user\'s text.',
    'Format: numbered list 1–10. Each item is one sentence, 7–14 words, no hashtags, no quotes, 0–1 emoji max.',
    'Keep topic and intent; vary angle and phrasing. High signal only.',
    'Source text:\n{\n{text}\n}',
    'Section guidelines: {sectionGuidelines}'
  ].join('\n\n'),

  convert_hook_type: [
    'Rewrite the hook as a {option} hook (one sentence).',
    'Allowed types: problem, benefit, curiosity, question. Keep the same topic and intent.',
    'No preface or quotes; output only the new hook.',
    'Source hook:\n{\n{text}\n}',
    'Section guidelines: {sectionGuidelines}'
  ].join('\n\n'),

  change_hook_style: [
    'Restyle the hook to the {option} style (one sentence).',
    'Styles: question, story, statistic, metaphor. Keep meaning and topic; increase stopping power.',
    'No preface or quotes; output only the new hook.',
    'Source hook:\n{\n{text}\n}',
    'Section guidelines: {sectionGuidelines}'
  ].join('\n\n'),

  strengthen_transition: [
    'Rewrite a strong transition that bridges the hook to the value section.',
    'Output 1–2 sentences; create momentum and curiosity; avoid repeating the hook.',
    'No new claims or steps here. Output only the transition.',
    'Source transition:\n{\n{text}\n}',
    'Section guidelines: {sectionGuidelines}'
  ].join('\n\n'),

  add_curiosity: [
    'Append a single curiosity “open-loop” sentence to the end of the text.',
    'Tease what\'s next without spoiling the value; ethical intrigue only.',
    'Return the full text with the new curiosity sentence appended.',
    'Source text:\n{\n{text}\n}',
    'Section guidelines: {sectionGuidelines}'
  ].join('\n\n'),

  simplify_bridge: [
    'Rewrite the bridge using everyday language.',
    'Output 1–2 short sentences; use simple connectors (so, but, because); remove fluff.',
    'Output only the rewritten bridge; no preface.',
    'Source bridge:\n{\n{text}\n}',
    'Section guidelines: {sectionGuidelines}'
  ].join('\n\n'),

  add_proof: [
    'Add a short, ethical proof line at the end to support the claim.',
    'Choose one: simple data point (with honest, non-specific quantifier), experience-based qualifier, or neutral credibility statement.',
    'Do NOT invent specific statistics, names, or sources. If specifics are unknown, use qualitative phrasing.',
    'Return the full text with a single proof line appended after a blank line.',
    'Source text:\n{\n{text}\n}',
    'Section guidelines: {sectionGuidelines}'
  ].join('\n\n'),

  make_actionable: [
    'Add a compact step-by-step block after the text.',
    'Format exactly: “Here\'s how:” then 3 numbered steps (imperative verbs), then one “Pro tip:” line.',
    'Keep total under 90 words. Tailor steps to the text; avoid platitudes.',
    'Return the full text followed by the steps block.',
    'Source text:\n{\n{text}\n}',
    'Section guidelines: {sectionGuidelines}'
  ].join('\n\n'),

  enhance_value: [
    'Emphasize why this matters by sharpening the core payoff.',
    'Add 1–2 concise sentences that make the outcome specific and tangible.',
    'Return the full text with the value amplification appended.',
    'Source text:\n{\n{text}\n}',
    'Section guidelines: {sectionGuidelines}'
  ].join('\n\n'),

  add_urgency: [
    'Add one ethical urgency sentence to the end of the CTA.',
    'Avoid false scarcity or fake deadlines. Focus on momentum and opportunity cost.',
    'Return the full text with the urgency sentence appended.',
    'Source CTA:\n{\n{text}\n}',
    'Section guidelines: {sectionGuidelines}'
  ].join('\n\n'),

  make_specific: [
    'Make the CTA specific and doable by adding concrete micro-actions.',
    'Return 3–5 short bullets starting with a strong verb; platform-agnostic; total under 60 words.',
    'Replace any vague asks with clear next steps. Return the full CTA with bullets appended.',
    'Source CTA:\n{\n{text}\n}',
    'Section guidelines: {sectionGuidelines}'
  ].join('\n\n'),

  strengthen_benefit: [
    'Strengthen the benefit by listing concrete outcomes.',
    'Append 3–5 short bullets starting with a checkmark or similar symbol; avoid exaggeration; total under 80 words.',
    'Return the full text with the benefit bullets appended.',
    'Source text:\n{\n{text}\n}',
    'Section guidelines: {sectionGuidelines}'
  ].join('\n\n')
};

function getSectionGuidelines(sectionType?: string): string {
  if (!sectionType) return [SECTION_GUIDELINES.hook, 'Keep copy concise and high-signal.'].join(' ');
  return SECTION_GUIDELINES[sectionType] || SECTION_GUIDELINES.hook;
}

function buildPrompt(actionType: string, text: string, option?: string, sectionType?: string): string {
  const template = ACTION_PROMPTS[actionType] || '{text}';
  const guidelines = getSectionGuidelines(sectionType);
  return template
    .replaceAll('{text}', text)
    .replaceAll('{option}', option || '')
    .replaceAll('{sectionType}', sectionType || 'section')
    .replaceAll('{sectionGuidelines}', guidelines);
}

// --- LLM integration (OpenAI / Anthropic / Gemini) ---
type Provider = 'openai' | 'anthropic' | 'gemini' | 'none';

function detectProvider(): { provider: Provider; reason?: string } {
  const prefer = (process.env.LLM_PROVIDER || 'auto').toLowerCase();

  // Only consider server-side keys in API routes; do not use VITE_* client keys here
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (prefer === 'openai' && openaiKey) return { provider: 'openai' };
  if (prefer === 'anthropic' && anthropicKey) return { provider: 'anthropic' };
  if (prefer === 'gemini' && geminiKey) return { provider: 'gemini' };

  // Auto-pick based on available keys (priority: OpenAI -> Anthropic -> Gemini)
  if (openaiKey) return { provider: 'openai' };
  if (anthropicKey) return { provider: 'anthropic' };
  if (geminiKey) return { provider: 'gemini' };
  return { provider: 'none', reason: 'No API key configured' };
}

async function withTimeout<T>(p: Promise<T>, ms = 20000): Promise<T> {
  let t: any;
  const timeout = new Promise<never>((_, reject) => {
    t = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(t);
  }
}

async function callOpenAI(prompt: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  if (!key) throw new Error('Missing OPENAI_API_KEY');
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        { role: 'system', content: 'You are a concise writing editor. Follow instructions exactly. Output only the final text.' },
        { role: 'user', content: prompt }
      ]
    })
  });
  if (!resp.ok) throw new Error(`OpenAI API error ${resp.status}`);
  const data: any = await resp.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('OpenAI: empty response');
  return text;
}

async function callAnthropic(prompt: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  if (!key) throw new Error('Missing ANTHROPIC_API_KEY');
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': process.env.ANTHROPIC_API_VERSION || '2023-06-01'
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest',
      max_tokens: 800,
      temperature: 0.7,
      messages: [
        { role: 'user', content: prompt }
      ]
    })
  });
  if (!resp.ok) throw new Error(`Anthropic API error ${resp.status}`);
  const data: any = await resp.json();
  const parts = data?.content;
  const text = Array.isArray(parts)
    ? parts.map((p: any) => p?.text).filter(Boolean).join('\n').trim()
    : '';
  if (!text) throw new Error('Anthropic: empty response');
  return text;
}

async function callGemini(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!key) throw new Error('Missing GEMINI_API_KEY');
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, candidateCount: 1, maxOutputTokens: 1024 }
    })
  });
  if (!resp.ok) throw new Error(`Gemini API error ${resp.status}`);
  const data: any = await resp.json();
  const cand = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(cand)
    ? cand.map((p: any) => p?.text).filter(Boolean).join('\n').trim()
    : '';
  if (!text) throw new Error('Gemini: empty response');
  return text;
}

async function runLLM(prompt: string): Promise<{ text: string; provider: Provider }> {
  const { provider, reason } = detectProvider();
  if (provider === 'none') throw new Error(reason || 'No provider');
  try {
    let text = '';
    if (provider === 'openai') text = await withTimeout(callOpenAI(prompt));
    else if (provider === 'anthropic') text = await withTimeout(callAnthropic(prompt));
    else if (provider === 'gemini') text = await withTimeout(callGemini(prompt));
    else throw new Error('Unsupported provider');
    return { text, provider };
  } catch (err) {
    // Surface the provider used for easier debugging
    const msg = (err as Error)?.message || 'LLM error';
    throw new Error(`${provider} failure: ${msg}`);
  }
}

function extractTheme(text: string): string {
  const words = text.toLowerCase().split(/\s+/);
  const commonWords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','this','that','you','your','is','are','was','were','will','would','could','should']);
  const meaningfulWords = words.filter(w => w.length > 3 && !commonWords.has(w) && /^[a-z]+$/.test(w));
  return meaningfulWords[0] || 'this topic';
}

function simplifyText(text: string): string {
  return text
    .replace(/\b(essentially|fundamentally|systematically)\b/gi, '')
    .replace(/\b(utilize|implement|facilitate)\b/gi, (m) => m.toLowerCase() === 'utilize' ? 'use' : m.toLowerCase() === 'implement' ? 'do' : m.toLowerCase() === 'facilitate' ? 'help' : m)
    .replace(/\b(in order to|for the purpose of)\b/gi, 'to')
    .replace(/[.!?]+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateHookVariations(text: string): string {
  const baseTheme = extractTheme(text);
  const variations = [
    `🔥 Stop everything! This ${baseTheme} secret will change your perspective forever!`,
    `Did you know there's a hidden truth about ${baseTheme} that 95% of people miss?`,
    `I tried every ${baseTheme} approach out there. Here's what actually worked...`,
    `The biggest ${baseTheme} mistake I see everywhere (and how to avoid it)`,
    `This ${baseTheme} revelation hit me like a ton of bricks! 🤯`,
    `Everyone thinks they know ${baseTheme}, but this will surprise you...`,
    `What if everything you believed about ${baseTheme} was wrong?`,
    `The ${baseTheme} industry doesn't want you to know this simple trick`,
    `I wish someone told me this ${baseTheme} truth 5 years ago!`,
    `This 30-second ${baseTheme} insight is worth thousands of dollars 💰`
  ];
  return variations.map((v, i) => `${i + 1}. ${v}`).join('\n\n');
}

function convertHookType(text: string, type: string): string {
  const theme = extractTheme(text);
  switch (type) {
    case 'problem':
      return `Are you struggling with ${theme} and feeling stuck? You're not alone - and here's why it's happening...`;
    case 'benefit':
      return `Imagine mastering ${theme} and seeing incredible results in just days. Here's how...`;
    case 'curiosity':
      return `There's something about ${theme} that most people never discover. Are you ready to find out?`;
    case 'question':
      return `What if I told you that everything you think you know about ${theme} is incomplete?`;
    default:
      return `${text} (converted to ${type} style)`;
  }
}

function changeHookStyle(text: string, style: string): string {
  const theme = extractTheme(text);
  switch (style) {
    case 'question':
      return `Have you ever wondered why some people excel at ${theme} while others struggle? The answer might surprise you...`;
    case 'story':
      return `Last week, I watched someone completely transform their ${theme} approach. Here's what happened...`;
    case 'statistic':
      return `87% of people approach ${theme} completely wrong. Here's what the top 13% do differently...`;
    case 'metaphor':
      return `Think of ${theme} like building a house - most people start with the roof instead of the foundation...`;
    default:
      return `${text} (styled as ${style})`;
  }
}

function strengthenTransition(text: string): string {
  if (text.toLowerCase().includes("here's")) {
    return `But here's where it gets interesting - ${text.replace(/^.*?here's/i, "here's")}`;
  }
  if (text.toLowerCase().includes('the thing is')) {
    return `${text} And once you understand this, everything changes.`;
  }
  return `Now, ${text.toLowerCase()} This is the turning point where most people either succeed or give up.`;
}

function addCuriosity(text: string): string {
  return `${text} But what happened next will completely surprise you... (and it's not what you think)`;
}

function simplifyBridge(text: string): string {
  return text
    .replace(/\b(however|nevertheless|furthermore)\b/gi, 'but')
    .replace(/\b(consequently|therefore|thus)\b/gi, 'so')
    .replace(/\b(in addition|moreover)\b/gi, 'also')
    .trim();
}

function addProof(text: string): string {
  const proofs = [
    'Recent studies show that this approach delivers 3x better results.',
    "I've tested this with over 500 people, and 89% saw improvement within 30 days.",
    'This method is backed by research from leading experts in the field.'
  ];
  return `${text}\n\n${proofs[Math.floor(Math.random() * proofs.length)]}`;
}

function makeActionable(text: string): string {
  const steps = `\n\nHere's exactly how to do it:\n1. Start by identifying your main challenge\n2. Apply this principle for 10 minutes daily\n3. Track your progress and adjust as needed\n\nPro tip: Set a reminder on your phone to practice this every morning.`;
  return `${text}${steps}`;
}

function enhanceValue(text: string): string {
  return `${text}\n\nThis single insight can save you months of trial and error and potentially thousands of dollars in mistakes. It's the difference between those who succeed quickly and those who struggle for years.`;
}

function addUrgency(text: string): string {
  const options = [
    "Don't wait - the longer you delay, the harder it becomes!",
    'This opportunity will not last forever. Act now!',
    'Every day you wait is another day of missed potential.',
    'The best time to start was yesterday. The second best time is RIGHT NOW!'
  ];
  return `${text} ${options[Math.floor(Math.random() * options.length)]}`;
}

function makeSpecific(text: string): string {
  return `${text}\n\nHere's your next step:\n→ Like this post if it helped you\n→ Follow for daily tips like this\n→ Comment "YES" if you're ready to try this\n→ Share with 3 friends who need to see this\n→ Save this post for later reference\n\nDo this in the next 60 seconds while it's fresh in your mind!`;
}

function strengthenBenefit(text: string): string {
  return `${text}\n\nWhen you do this, you'll:\n✓ Save hours of frustration and confusion\n✓ See faster results than 90% of people\n✓ Build confidence in your abilities\n✓ Create momentum that lasts\n✓ Position yourself as someone who takes action\n\nThe transformation starts the moment you decide to act.`;
}

function enhanceGeneric(text: string, actionType: string): string {
  return `${text}\n\n[Enhanced with ${actionType} action - this would be processed by AI in production]`;
}

function generateMockResponse(actionType: string, text: string, option?: string, sectionType?: string): string {
  switch (actionType) {
    case 'simplify': return simplifyText(text);
    case 'generate_variations': return generateHookVariations(text);
    case 'convert_hook_type': return convertHookType(text, option || 'question');
    case 'change_hook_style': return changeHookStyle(text, option || 'question');
    case 'strengthen_transition': return strengthenTransition(text);
    case 'add_curiosity': return addCuriosity(text);
    case 'simplify_bridge': return simplifyBridge(text);
    case 'add_proof': return addProof(text);
    case 'make_actionable': return makeActionable(text);
    case 'enhance_value': return enhanceValue(text);
    case 'add_urgency': return addUrgency(text);
    case 'make_specific': return makeSpecific(text);
    case 'strengthen_benefit': return strengthenBenefit(text);
    default: return enhanceGeneric(text, actionType);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  try {
    const body = (req.body || {}) as AIActionRequest;
    const { actionType, text, option, sectionType } = body;
    if (!actionType) return res.status(400).json({ success: false, error: 'Action type is required' });
    if (!text || !text.trim()) return res.status(400).json({ success: false, error: 'Text content is required' });
    if (!Object.prototype.hasOwnProperty.call(ACTION_PROMPTS, actionType)) {
      return res.status(400).json({ success: false, error: `Unsupported action type: ${actionType}` });
    }
    const prompt = buildPrompt(actionType, text, option, sectionType);

    let modifiedText = '';
    let source: 'llm' | 'mock' = 'mock';
    let providerUsed: Provider | null = null;

    // Default to mock in non-production unless explicitly disabled
    const preferMock = String(
      process.env.USE_MOCK_AI ?? (process.env.NODE_ENV !== 'production' ? 'true' : 'false')
    ).toLowerCase() === 'true';
    if (!preferMock) {
      try {
        const { text: llmText, provider } = await runLLM(prompt);
        modifiedText = (llmText || '').trim();
        source = 'llm';
        providerUsed = provider;
      } catch (e) {
        // Fallback to mock generator on any error
        modifiedText = generateMockResponse(actionType, text, option, sectionType);
        source = 'mock';
      }
    } else {
      modifiedText = generateMockResponse(actionType, text, option, sectionType);
      source = 'mock';
    }

    // Simulated latency only for mock mode to keep UI feeling realistic in dev
    if (source === 'mock') {
      const delay = actionType === 'generate_variations' ? 2000 : 1000;
      await new Promise((r) => setTimeout(r, delay + Math.random() * 500));
    }

    // Return the constructed prompt as metadata for transparency and future LLM integration
    return res.json({ success: true, modifiedText, prompt, meta: { actionType, option: option || null, sectionType: sectionType || null, source, provider: providerUsed } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Failed to process AI action' });
  }
}
