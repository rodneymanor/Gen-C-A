import { NextRequest } from "next/server";

interface AIActionRequest {
  actionType: string;
  text: string;
  option?: string;
  sectionType?: string;
}

interface AIActionResponse {
  success: boolean;
  modifiedText?: string;
  error?: string;
}

// Action-specific prompt templates
const ACTION_PROMPTS: Record<string, string> = {
  simplify: "Rewrite this text to be simpler and easier to understand while maintaining its core message: {text}",
  generate_variations: "Create 10 different variations of this hook, each with a unique approach and style: {text}",
  convert_hook_type: "Convert this hook to a {option} style hook while keeping the same topic: {text}",
  change_hook_style: "Rewrite this hook in a {option} style while maintaining the core message: {text}",
  strengthen_transition: "Improve this bridge/transition to create better flow and connection: {text}",
  add_curiosity: "Rewrite this bridge to make it more intriguing and curiosity-driven: {text}",
  simplify_bridge: "Simplify this bridge/transition while maintaining its connecting function: {text}",
  add_proof: "Enhance this content by adding supporting evidence, statistics, or proof points: {text}",
  make_actionable: "Rewrite this to include specific, actionable steps or tips: {text}",
  enhance_value: "Strengthen the core value proposition and insight in this content: {text}",
  add_urgency: "Rewrite this call-to-action to create more urgency and motivation: {text}",
  make_specific: "Make this call-to-action more specific with clear, actionable steps: {text}",
  strengthen_benefit: "Enhance this call-to-action by emphasizing what the user will gain: {text}"
};

// Mock AI response generators for different action types
const generateMockResponse = (actionType: string, text: string, option?: string): string => {
  switch (actionType) {
    case "simplify":
      return simplifyText(text);

    case "generate_variations":
      return generateHookVariations(text);

    case "convert_hook_type":
      return convertHookType(text, option || "question");

    case "change_hook_style":
      return changeHookStyle(text, option || "question");

    case "strengthen_transition":
      return strengthenTransition(text);

    case "add_curiosity":
      return addCuriosity(text);

    case "simplify_bridge":
      return simplifyBridge(text);

    case "add_proof":
      return addProof(text);

    case "make_actionable":
      return makeActionable(text);

    case "enhance_value":
      return enhanceValue(text);

    case "add_urgency":
      return addUrgency(text);

    case "make_specific":
      return makeSpecific(text);

    case "strengthen_benefit":
      return strengthenBenefit(text);

    default:
      return enhanceGeneric(text, actionType);
  }
};

// Individual response generators
function simplifyText(text: string): string {
  // Extract key concepts and simplify language
  const simplified = text
    .replace(/\b(essentially|fundamentally|systematically)\b/gi, '')
    .replace(/\b(utilize|implement|facilitate)\b/gi, (match) => {
      if (match.toLowerCase() === 'utilize') return 'use';
      if (match.toLowerCase() === 'implement') return 'do';
      if (match.toLowerCase() === 'facilitate') return 'help';
      return match;
    })
    .replace(/\b(in order to|for the purpose of)\b/gi, 'to')
    .replace(/[.!?]+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();

  return simplified || text;
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

  return variations.map((variation, index) => `${index + 1}. ${variation}`).join('\n\n');
}

function convertHookType(text: string, type: string): string {
  const theme = extractTheme(text);

  switch (type) {
    case "problem":
      return `Are you struggling with ${theme} and feeling stuck? You're not alone - and here's why it's happening...`;

    case "benefit":
      return `Imagine mastering ${theme} and seeing incredible results in just days. Here's how...`;

    case "curiosity":
      return `There's something about ${theme} that most people never discover. Are you ready to find out?`;

    case "question":
      return `What if I told you that everything you think you know about ${theme} is incomplete?`;

    default:
      return `${text} (converted to ${type} style)`;
  }
}

function changeHookStyle(text: string, style: string): string {
  const theme = extractTheme(text);

  switch (style) {
    case "question":
      return `Have you ever wondered why some people excel at ${theme} while others struggle? The answer might surprise you...`;

    case "story":
      return `Last week, I watched someone completely transform their ${theme} approach. Here's what happened...`;

    case "statistic":
      return `87% of people approach ${theme} completely wrong. Here's what the top 13% do differently...`;

    case "metaphor":
      return `Think of ${theme} like building a house - most people start with the roof instead of the foundation...`;

    default:
      return `${text} (styled as ${style})`;
  }
}

function strengthenTransition(text: string): string {
  // Add stronger connecting words and improve flow
  if (text.toLowerCase().includes("here's")) {
    return `But here's where it gets interesting - ${text.replace(/^.*?here's/i, "here's")}`;
  }

  if (text.toLowerCase().includes("the thing is")) {
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
  const proofElements = [
    "Recent studies show that this approach delivers 3x better results.",
    "I've tested this with over 500 people, and 89% saw improvement within 30 days.",
    "This method is backed by research from leading experts in the field."
  ];

  const randomProof = proofElements[Math.floor(Math.random() * proofElements.length)];
  return `${text}\n\n${randomProof}`;
}

function makeActionable(text: string): string {
  const actionableSteps = `

Here's exactly how to do it:
1. Start by identifying your main challenge
2. Apply this principle for 10 minutes daily
3. Track your progress and adjust as needed

Pro tip: Set a reminder on your phone to practice this every morning.`;

  return `${text}${actionableSteps}`;
}

function enhanceValue(text: string): string {
  return `${text}

This single insight can save you months of trial and error and potentially thousands of dollars in mistakes. It's the difference between those who succeed quickly and those who struggle for years.`;
}

function addUrgency(text: string): string {
  const urgencyElements = [
    "Don't wait - the longer you delay, the harder it becomes!",
    "This opportunity won't last forever. Act now!",
    "Every day you wait is another day of missed potential.",
    "The best time to start was yesterday. The second best time is RIGHT NOW!"
  ];

  const urgency = urgencyElements[Math.floor(Math.random() * urgencyElements.length)];
  return `${text} ${urgency}`;
}

function makeSpecific(text: string): string {
  return `${text}

Here's your next step:
→ Like this post if it helped you
→ Follow for daily tips like this
→ Comment "YES" if you're ready to try this
→ Share with 3 friends who need to see this
→ Save this post for later reference

Do this in the next 60 seconds while it's fresh in your mind!`;
}

function strengthenBenefit(text: string): string {
  return `${text}

When you do this, you'll:
✓ Save hours of frustration and confusion
✓ See faster results than 90% of people
✓ Build confidence in your abilities
✓ Create momentum that lasts
✓ Position yourself as someone who takes action

The transformation starts the moment you decide to act.`;
}

function enhanceGeneric(text: string, actionType: string): string {
  return `${text}\n\n[Enhanced with ${actionType} action - this would be processed by AI in production]`;
}

function extractTheme(text: string): string {
  // Simple theme extraction - in production, this would be more sophisticated
  const words = text.toLowerCase().split(/\s+/);
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'this', 'that', 'you', 'your', 'is', 'are', 'was', 'were', 'will', 'would', 'could', 'should']);

  const meaningfulWords = words.filter(word =>
    word.length > 3 &&
    !commonWords.has(word) &&
    /^[a-z]+$/.test(word)
  );

  return meaningfulWords[0] || "this topic";
}

export async function POST(request: NextRequest) {
  console.log("🤖 [API] /api/ai-action endpoint called");

  try {
    console.log("📦 [API] Parsing request body...");
    const body = await request.json();
    console.log("📄 [API] Raw request body:", body);

    const { actionType, text, option, sectionType }: AIActionRequest = body;
    console.log("🔍 [API] Parsed parameters:", { actionType, text: text?.substring(0, 100) + "...", option, sectionType });

    // Validation
    if (!actionType || actionType.trim().length === 0) {
      console.log("❌ [API] Validation failed: actionType is required");
      return Response.json(
        { success: false, error: "Action type is required" },
        { status: 400 }
      );
    }

    if (!text || text.trim().length === 0) {
      console.log("❌ [API] Validation failed: text is required");
      return Response.json(
        { success: false, error: "Text content is required" },
        { status: 400 }
      );
    }

    // Check if action type is supported
    const supportedActions = Object.keys(ACTION_PROMPTS);
    if (!supportedActions.includes(actionType)) {
      console.log("❌ [API] Validation failed: unsupported action type");
      return Response.json(
        { success: false, error: `Unsupported action type: ${actionType}` },
        { status: 400 }
      );
    }

    // Generate AI response
    console.log("🤖 [API] Generating AI response...");
    const modifiedText = generateMockResponse(actionType, text, option);
    console.log("📝 [API] Generated response length:", modifiedText.length);

    // Add some processing delay to simulate real AI processing
    console.log("⏱️ [API] Adding processing delay...");
    const delay = actionType === 'generate_variations' ? 2000 : 1000;
    await new Promise(resolve => setTimeout(resolve, delay + Math.random() * 500));

    const response: AIActionResponse = {
      success: true,
      modifiedText
    };

    console.log("✅ [API] Sending successful response");
    return Response.json(response);

  } catch (error) {
    console.error("❌ [API] AI action error:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process AI action"
      },
      { status: 500 }
    );
  }
}