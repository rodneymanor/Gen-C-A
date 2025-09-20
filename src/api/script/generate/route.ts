import { NextRequest } from "next/server";

interface GenerateScriptRequest {
  idea: string;
  length: "15" | "20" | "30" | "45" | "60" | "90";
  brandVoiceId?: string;
}

interface GeneratedScript {
  hook: string;
  bridge: string;
  goldenNugget: string;
  wta: string;
}

interface GenerateScriptResponse {
  success: boolean;
  script?: GeneratedScript;
  error?: string;
}

export async function POST(request: NextRequest) {
  console.log("🎯 [API] /api/script/generate endpoint called");
  
  try {
    console.log("📦 [API] Parsing request body...");
    const body = await request.json();
    console.log("📄 [API] Raw request body:", body);
    
    const { idea, length = "60", brandVoiceId }: GenerateScriptRequest = body;
    console.log("🔍 [API] Parsed parameters:", { idea, length, brandVoiceId });

    if (!idea || idea.trim().length === 0) {
      console.log("❌ [API] Validation failed: idea is required");
      return Response.json(
        { success: false, error: "Script idea is required" },
        { status: 400 }
      );
    }

    // Simulate script generation with realistic components
    const generateScriptComponents = (idea: string, length: string): GeneratedScript => {
      // Hook - attention-grabbing opener
      const hooks = [
        `🔥 Stop scrolling! You NEED to hear this about "${idea.split(' ').slice(0, 3).join(' ')}"...`,
        `Wait... did you know this secret about ${idea.toLowerCase()}? 👀`,
        `I can't believe more people don't know this ${idea.toLowerCase()} trick!`,
        `This ${idea.toLowerCase()} revelation will blow your mind! 🤯`,
        `ATTENTION: This changes everything about ${idea.toLowerCase()}! ⚡`
      ];

      // Bridge - problem/transition
      const bridges = [
        `Here's the thing most people get wrong about ${idea.toLowerCase()}...`,
        `Let me break down exactly why this matters for you:`,
        `The problem is, everyone thinks they know about ${idea.toLowerCase()}, but...`,
        `I used to struggle with this too, until I discovered...`,
        `After researching this for months, here's what I found:`
      ];

      // Golden Nugget - main value/solution
      const goldenNuggets = [
        `The secret is this 3-step approach:\n1. Start with understanding the fundamentals\n2. Apply the core principle consistently\n3. Scale it up gradually for maximum impact`,
        `Here's the exact formula that works:\n• Focus on quality over quantity\n• Stay consistent with your approach\n• Track your progress and adjust accordingly`,
        `The game-changer is this simple shift in perspective:\nInstead of trying to do everything at once, focus on mastering one element at a time`,
        `What actually works is combining these three elements:\n✓ Proper foundation\n✓ Consistent execution\n✓ Strategic optimization`
      ];

      // WTA - why to act
      const wtas = [
        `Try this approach for the next 7 days and let me know your results in the comments! 👇 Follow for more tips like this! 🔔`,
        `Which part resonated with you most? Drop a comment below! 💬 And don't forget to save this for later! 📌`,
        `Ready to level up? Hit that follow button for daily insights! 🚀 Share this with someone who needs to see it! ↗️`,
        `What's your experience with ${idea.toLowerCase()}? Let's discuss! 💭 Save this post and tag a friend! 👥`
      ];

      // Select components based on idea keywords
      const ideaLower = idea.toLowerCase();
      let hookIndex = 0;
      let bridgeIndex = 0;
      let nuggetIndex = 0;
      let wtaIndex = 0;

      // Simple keyword-based selection
      if (ideaLower.includes('tip') || ideaLower.includes('hack')) {
        hookIndex = 2;
        nuggetIndex = 1;
      } else if (ideaLower.includes('secret') || ideaLower.includes('reveal')) {
        hookIndex = 1;
        bridgeIndex = 2;
      } else if (ideaLower.includes('mistake') || ideaLower.includes('wrong')) {
        hookIndex = 4;
        bridgeIndex = 0;
      }

      return {
        hook: hooks[hookIndex],
        bridge: bridges[bridgeIndex],
        goldenNugget: goldenNuggets[nuggetIndex],
        wta: wtas[wtaIndex]
      };
    };

    // Generate the script components
    console.log("🤖 [API] Generating script components...");
    const script = generateScriptComponents(idea, length);
    console.log("📝 [API] Generated script:", script);

    // Add some processing delay to simulate real AI generation
    console.log("⏱️ [API] Adding processing delay...");
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    const response: GenerateScriptResponse = {
      success: true,
      script
    };

    console.log("✅ [API] Sending successful response:", response);
    return Response.json(response);

  } catch (error) {
    console.error("Script generation error:", error);
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to generate script" 
      },
      { status: 500 }
    );
  }
}