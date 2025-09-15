import { NextRequest, NextResponse } from "next/server";

import { GeminiService } from "@/lib/gemini";

interface GenerateMetadataRequest {
  voiceAnalysis: any; // Voice analysis data from analyze-patterns endpoint
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateMetadataRequest = await request.json();
    const { voiceAnalysis } = body;

    if (!voiceAnalysis) {
      return NextResponse.json({ error: "Voice analysis data is required" }, { status: 400 });
    }

    console.log("🎭 Generating persona title and description from voice analysis");

    const prompt = `# Voice Analysis to Video Script Persona Generator

You are tasked with creating a compelling persona title and description based on voice analysis data.

## Voice Analysis Data Provided:
${JSON.stringify(voiceAnalysis, null, 2)}

## Primary Instruction
Analyze the provided voice analysis data and create a compelling user persona title and description that content creators can use to write short-form video scripts. Follow the established template structure below.

## Template Structure to Follow

### Title Format:
[Adjective] [Core Identity/Role] [Specialty]
- Use 2-4 words maximum
- Lead with energy/style descriptor
- Include the core role/identity
- End with area of expertise

### Description Format:
**Opening Statement** (1-2 sentences)
A brief overview that captures the persona's essence, communication style, and primary value proposition.

**Key Characteristics:** (6-8 bullet points)
- Communication Style: [sentence structure, vocabulary, delivery approach]
- Authority Building: [how they establish credibility and expertise]
- Hook Mastery: [opening techniques with specific examples in quotes]
- [Unique Strength]: [distinctive approach or method]
- Proof-Driven/Results Focus: [how they use evidence and outcomes]
- [Problem-Solution/Teaching Method]: [core instructional approach]
- [Additional Key Trait]: [another defining characteristic]

**Closing Statement** (2-3 sentences)
Summary of what makes this persona effective, ideal use cases, and target audience appeal.

## Analysis Instructions

### Step 1: Extract Core Identity
From the voice analysis, identify:
- Primary communication style (energy level, formality)
- Main content approach (problem-solution, educational, motivational)
- Distinctive linguistic patterns
- Target audience pain points

### Step 2: Identify Signature Elements
Look for:
- Unique hook patterns and templates
- Specific transition phrases
- Rhetorical devices used
- Credibility-building methods
- Persuasion techniques

### Step 3: Create Persona Title
- Choose an energy/style adjective that matches the voice profile
- Select a role that fits the content approach
- Add a specialty based on the subject matter focus

### Step 4: Write Description
- Open with the persona's core value and style
- Structure key characteristics using the template format
- Include specific examples from the voice analysis in quotes
- Close with effectiveness summary and ideal applications

## Output Requirements
Generate a JSON response with EXACTLY this structure:
{
  "title": "[2-4 word persona title following the format]",
  "description": {
    "opening": "[1-2 sentence opening statement]",
    "keyCharacteristics": [
      {
        "label": "Communication Style",
        "description": "[specific description with examples]"
      },
      {
        "label": "Authority Building",
        "description": "[how they establish credibility]"
      },
      {
        "label": "Hook Mastery",
        "description": "[opening techniques with quoted examples]"
      },
      {
        "label": "[Unique Strength Label]",
        "description": "[distinctive approach description]"
      },
      {
        "label": "Results Focus",
        "description": "[how they use evidence and outcomes]"
      },
      {
        "label": "[Teaching Method Label]",
        "description": "[core instructional approach]"
      },
      {
        "label": "[Additional Trait Label]",
        "description": "[another defining characteristic]"
      }
    ],
    "closing": "[2-3 sentence closing statement]"
  },
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

## Quality Requirements:
- Title must be 2-4 words and follow the format
- Include actual phrases from the voice analysis in quotes
- Make the persona actionable for script writing
- Match the energy and tone identified in the analysis
- Ensure the persona is clearly differentiated and memorable

Generate the persona title and description now:`;

    const result = await GeminiService.generateContent({
      prompt,
      responseType: "json",
      temperature: 0.7,
      maxTokens: 2000,
      model: "gemini-1.5-flash",
    });

    if (!result.success || !result.content) {
      console.error("Persona metadata generation failed:", result.error);
      return NextResponse.json({ error: result.error ?? "Failed to generate persona metadata" }, { status: 500 });
    }

    // Parse the JSON response
    let metadata;
    try {
      metadata = JSON.parse(result.content);
      console.log("✅ Persona metadata generated successfully");
      console.log(`  Title: ${metadata.title}`);
      console.log(`  Tags: ${metadata.suggestedTags?.join(", ")}`);
    } catch (parseError) {
      console.error("Failed to parse metadata response:", parseError);
      return NextResponse.json({ error: "Failed to parse generated metadata" }, { status: 500 });
    }

    // Format description for easier use
    const formattedDescription = formatDescription(metadata.description);

    return NextResponse.json({
      success: true,
      title: metadata.title,
      description: formattedDescription,
      structuredDescription: metadata.description,
      suggestedTags: metadata.suggestedTags ?? [],
    });
  } catch (error) {
    console.error("Persona metadata generation error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate persona metadata",
      },
      { status: 500 },
    );
  }
}

// Helper function to format description into a single string
function formatDescription(desc: any): string {
  let formatted = desc.opening + "\n\n";

  formatted += "Key Characteristics:\n";
  desc.keyCharacteristics.forEach((char: any) => {
    formatted += `• ${char.label}: ${char.description}\n`;
  });

  formatted += "\n" + desc.closing;

  return formatted;
}
