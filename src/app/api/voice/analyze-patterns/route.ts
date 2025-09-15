import { NextRequest, NextResponse } from "next/server";

import { GeminiService } from "@/lib/gemini";
import { parseJsonWithRecovery, validateAnalysisResponse, createPartialResponse } from "@/lib/utils/json-parser";

interface AnalyzeRequest {
  transcripts: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { transcripts } = body;

    if (!transcripts || !Array.isArray(transcripts) || transcripts.length < 3) {
      return NextResponse.json({ error: "Need at least 3 transcripts to analyze voice patterns" }, { status: 400 });
    }

    // Limit to 10 transcripts for efficient processing
    const scriptsToAnalyze = transcripts.slice(0, 10);
    if (transcripts.length > 10) {
      console.log(`⚠️ Limiting analysis to first 10 transcripts (received ${transcripts.length})`);
    }

    console.log(`🎙️ Analyzing voice patterns for ${scriptsToAnalyze.length} transcripts`);

    // Generate analysis with retry logic
    const generateAnalysisWithRetry = async (maxRetries = 3): Promise<any> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔄 Analysis attempt ${attempt}/${maxRetries}`);

          const result = await GeminiService.generateContent({
            prompt: createOptimizedPrompt(scriptsToAnalyze),
            responseType: "text",
            temperature: 0.1, // Lower temperature for more consistent JSON output
            maxTokens: 16384,
            model: "gemini-1.5-flash",
          });

          if (!result.success || !result.content) {
            throw new Error(`Generation failed: ${result.error ?? "No content received"}`);
          }

          console.log(`📊 Response content length: ${result.content.length} characters`);

          // Parse with recovery
          const analysis = parseJsonWithRecovery(result.content);

          // Validate the response
          if (validateAnalysisResponse(analysis)) {
            console.log(`✅ Analysis succeeded on attempt ${attempt}`);
            return analysis;
          } else {
            // Try to create a partial response with defaults
            console.log(`⚠️ Validation failed, attempting partial recovery...`);
            const partialAnalysis = createPartialResponse(analysis);
            if (validateAnalysisResponse(partialAnalysis)) {
              console.log(`✅ Partial recovery successful on attempt ${attempt}`);
              return partialAnalysis;
            }
            throw new Error("Invalid analysis structure after recovery attempt");
          }
        } catch (error) {
          console.log(`❌ Attempt ${attempt} failed:`, error instanceof Error ? error.message : error);

          if (attempt === maxRetries) {
            // Final attempt - try fallback analysis with fewer transcripts
            console.log("🔄 Attempting fallback analysis with reduced scope...");
            return await fallbackAnalysis(scriptsToAnalyze.slice(0, 5));
          }

          // Exponential backoff between retries
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    };

    // Fallback analysis with reduced scope
    const fallbackAnalysis = async (reducedTranscripts: string[]): Promise<any> => {
      console.log(
        `🔄 Fallback: Analyzing ${reducedTranscripts.length} transcripts instead of ${scriptsToAnalyze.length}`,
      );

      try {
        const result = await GeminiService.generateContent({
          prompt: createSimplifiedPrompt(reducedTranscripts),
          responseType: "text",
          temperature: 0.1,
          maxTokens: 8192, // Smaller token limit for fallback
          model: "gemini-1.5-flash",
        });

        if (!result.success || !result.content) {
          throw new Error(`Fallback generation failed: ${result.error}`);
        }

        const analysis = parseJsonWithRecovery(result.content);
        return createPartialResponse(analysis); // Always use partial response for fallback
      } catch (error) {
        console.error("❌ Fallback analysis failed:", error);
        throw error;
      }
    };

    // Create optimized prompt with explicit JSON requirements
    const createOptimizedPrompt = (transcripts: string[]): string => {
      return `CRITICAL: Return ONLY valid, complete JSON. No markdown, no code blocks, no explanations.
Your response must start with { and end with }.

# Voice Pattern Analysis: Hook Extraction & Script Formula Generation

Analyze these ${scriptsToAnalyze.length} scripts to extract EVERY hook pattern and create a detailed step-by-step formula for generating new scripts in this creator's style.

PRIORITY FOCUS:
1. Extract ALL hook patterns (first 10 seconds of each script)
2. Create a DETAILED timestamped formula (10+ steps)
3. Make everything UNIVERSAL (works for any topic)

KEY REQUIREMENT: Every pattern must work for cooking, fitness, tech, business, or any other topic.

## Required Analysis Components:

### 1. LINGUISTIC FINGERPRINT
Analyze and extract:
- **Lexical Patterns**: Most frequently used words (excluding common words), preferred vocabulary tier, jargon/slang usage
- **Syntactic Structures**: Sentence length distribution, clause patterns, grammatical preferences
- **Discourse Markers**: How they transition between ideas (e.g., "Now", "Alright", "So", "Trust me")
- **Rhetorical Devices**: Repetition patterns, parallel structures, contrasts, metaphors

### 2. EXTRACT HOOKS FROM ALL ${scriptsToAnalyze.length} SCRIPTS (NON-NEGOTIABLE!)

YOU MUST INCLUDE A HOOK FROM EVERY SINGLE SCRIPT. This means:
- Script 1: Extract the opening hook
- Script 2: Extract the opening hook
- Script 3: Extract the opening hook
- Script 4: Extract the opening hook
- Script 5: Extract the opening hook
- Script 6: Extract the opening hook
- Script 7: Extract the opening hook
- Script 8: Extract the opening hook
- Script 9: Extract the opening hook
- Script 10: Extract the opening hook

For EACH hook, you MUST provide:
1. scriptNumber: The script number (1, 2, 3, etc.)
2. originalHook: COPY THE EXACT WORDS from the first 1-2 sentences
3. universalTemplate: Create a template with [PLACEHOLDERS] that works for ANY topic
4. type: Classify as problem/question/story/statement/warning/claim
5. trigger: Identify emotion (curiosity/frustration/fear/excitement/surprise)

MINIMUM REQUIREMENT: Your "allHooksExtracted" array MUST contain at least ${scriptsToAnalyze.length} entries!

### 3. AUTHORITY BUILDING PATTERNS (Universal)
How they establish credibility without domain specifics:
- Generic authority statements: "After [TIME_PERIOD] of [DOING_THING]..."
- Results framing: "I helped [NUMBER] [TYPE_OF_PEOPLE] achieve [OUTCOME]"
- Social proof timing: When in the script they mention credentials
- Trust-building phrases that work for any expertise

### 4. TRANSITIONAL ARCHITECTURE
Map how they move through content:
- Bridge phrases between concepts (exact phrases like "The next thing you need to understand")
- Topic pivot language
- Enumeration patterns ("First", "The next tip", "My last point")
- Parenthetical aside patterns

### 5. UNIVERSAL PERSUASION FRAMEWORKS
Extract argumentation patterns that work for any topic:
- Problem agitation: "Most people [COMMON_MISTAKE] which leads to [BAD_OUTCOME]"
- Solution reveal: "The answer is actually [SIMPLER/DIFFERENT] than you think"
- Objection handling: "You might be thinking [OBJECTION] but [COUNTER]"
- CTA progression: Universal action prompts (try, test, implement, start)

### 6. MICRO-PATTERNS
Capture distinctive speech quirks:
- Filler phrases and verbal tics
- Emphasis patterns (what words they stress)
- Repetition for effect patterns
- Specific number usage (round vs specific numbers)
- Time reference patterns

### 7. UNIVERSAL NARRATIVE STRUCTURES
Story patterns that work for any domain:
- Personal story arc: "I used to [OLD_STATE] until [TURNING_POINT] now [NEW_STATE]"
- Case study structure: "[SUBJECT] had [PROBLEM], we tried [SOLUTION], result was [OUTCOME]"
- Transformation framework: "From [STARTING_POINT] to [END_POINT] in [TIMEFRAME]"
- Results presentation: How they frame any type of success (percentages, timeframes, comparisons)

### 8. EMOTIONAL CADENCE
Track emotional progression:
- Energy level changes throughout videos
- Motivational language clusters
- Empathy/relatability phrases
- Urgency creation patterns

### 9. UNIVERSAL CONTENT FORMULAS
Templates that work regardless of subject matter:
- List structure: "# [THINGS] that [OUTCOME]" - works for any domain
- Comparison: "[OPTION_A] vs [OPTION_B]: Which [DOES_WHAT] better?"
- Myth-busting: "[NUMBER] [MISCONCEPTIONS] about [TOPIC] that [HARM_PROGRESS]"
- Teaching framework: "How to [ACHIEVE_RESULT] without [COMMON_OBSTACLE]"

### 10. CLOSING PATTERNS
How they end videos:
- Summary structures
- CTA language variations
- Follow/engagement requests
- Value restatement patterns

### 11. MANDATORY STEP-BY-STEP SCRIPT FORMULA (YOU MUST INCLUDE THIS!)

YOU ARE REQUIRED TO CREATE A "detailedScriptFormula" WITH EXACTLY 14 STEPS.

The formula MUST be inside "scriptGenerationRules" → "detailedScriptFormula" and contain:

"detailedScriptFormula": {
  "step1": "[00:00-00:03] Open with [TYPE] hook using HIGH energy. Say 'If you're [PROBLEM], I'll show you [SOLUTION]'",
  "step2": "[00:03-00:05] Quick transition. Say 'Listen' or 'Alright' to maintain attention",
  "step3": "[00:05-00:08] State credibility. Say 'After [TIME] of [EXPERTISE], I discovered...'",
  "step4": "[00:08-00:10] Promise value. Say 'In the next [TIME], you'll learn [BENEFIT]'",
  "step5": "[00:10-00:15] First main point. Say 'The first thing is [POINT]'",
  "step6": "[00:15-00:20] Second main point. Say 'Next, you need to [ACTION]'",
  "step7": "[00:20-00:25] Third point/story. Say 'My client [ACHIEVED] by [METHOD]'",
  "step8": "[00:25-00:30] Address objection. Say 'You might think [OBJECTION], but [COUNTER]'",
  "step9": "[00:30-00:35] Add proof. Say '[NUMBER]% of people who [ACTION] get [RESULT]'",
  "step10": "[00:35-00:40] Comparison. Say 'Most people [WRONG_WAY], but you should [RIGHT_WAY]'",
  "step11": "[00:40-00:45] Summary. Say 'Remember: [POINT1], [POINT2], [POINT3]'",
  "step12": "[00:45-00:50] Urgency. Say 'Only [NUMBER] spots' or 'Limited time'",
  "step13": "[00:50-00:55] CTA. Say 'Comment [WORD]' or 'Link in bio'",
  "step14": "[00:55-00:60] Final hook. Say 'Next video, I'll show you [TEASER]'"
}

THIS IS MANDATORY - YOU MUST INCLUDE ALL 14 STEPS!

## Output Format Required:

Return a VALID, COMPLETE JSON object with these exact sections. 
IMPORTANT: Use proper JSON formatting - numbers without quotes, strings in quotes, no trailing commas:

{
  "voiceProfile": {
    "distinctiveness": 8,
    "complexity": "simple",
    "primaryStyle": "educator"
  },
  
  "linguisticFingerprint": {
    "avgSentenceLength": 15,
    "vocabularyTier": {
      "simple": 30,
      "moderate": 50, 
      "advanced": 20
    },
    "topUniqueWords": ["words they use unusually often"],
    "avoidedWords": ["words they notably don't use"],
    "grammarQuirks": ["specific patterns like starting sentences with 'So'"]
  },
  
  "allHooksExtracted": [
    {
      "scriptNumber": 1,
      "originalHook": "Copy the EXACT opening 1-2 sentences from Script 1",
      "universalTemplate": "Template version with [PLACEHOLDERS]",
      "type": "problem|question|story|statement|warning|claim",
      "trigger": "curiosity|frustration|fear|excitement|surprise"
    },
    {
      "scriptNumber": 2,
      "originalHook": "Copy the EXACT opening 1-2 sentences from Script 2",
      "universalTemplate": "Template version with [PLACEHOLDERS]",
      "type": "problem|question|story|statement|warning|claim",
      "trigger": "curiosity|frustration|fear|excitement|surprise"
    }
    // MUST include ALL scripts analyzed
  ],
  "hookProgression": {
      "structure": "[HOOK_TYPE] → [TRANSITION_PHRASE] → [VALUE_PROMISE]",
      "avgWordCount": 20,
      "timing": "3 seconds",
      "examples": ["real progressions from scripts"]
    },
    "hookRules": [
      "Universal rules for hooks (e.g., 'Always start with action verb')",
      "Structure rules (e.g., 'Never exceed 10 words')",
      "Energy rules (e.g., 'Always high energy opening')"
    ]
  },
  
  "openingFormulas": [
    {
      "pattern": "[Exact pattern with placeholders]",
      "frequency": 10,
      "emotionalTrigger": "curiosity",
      "examples": ["real examples from scripts"]
    }
  ],
  
  "transitionPhrases": {
    "conceptBridges": ["exact phrases"],
    "enumeration": ["how they count points"],
    "topicPivots": ["how they change subjects"],
    "softeners": ["phrases that reduce resistance"]
  },
  
  "rhetoricalDevices": [
    {
      "device": "name of device",
      "pattern": "how they use it",
      "examples": ["specific instances"]
    }
  ],
  
  "microPatterns": {
    "fillers": ["um", "right", "you know"],
    "emphasisWords": ["really", "literally", "actually"],
    "numberPatterns": "specific|rounded|mixed",
    "timeReferences": ["how they reference time"]
  },
  
  "persuasionFramework": {
    "painPoints": ["how they articulate problems"],
    "solutions": ["how they present solutions"],
    "credibility": ["how they build trust"],
    "urgency": ["how they create FOMO"]
  },
  
  "contentTemplates": [
    {
      "type": "template name",
      "structure": "[Beginning] → [Middle] → [End]",
      "avgLength": "seconds or words",
      "examples": ["which scripts use this"]
    }
  ],
  
  "signatureMoves": [
    {
      "move": "specific technique name",
      "description": "what they do",
      "frequency": "how often",
      "placement": "where in video",
      "verbatim": ["exact quotes"]
    }
  ],
  
  "scriptGenerationRules": {
    "mustInclude": [
      "Universal elements (e.g., 'Personal connection in first 30 seconds')",
      "Structural requirements (e.g., 'Three main points')",
      "Energy patterns (e.g., 'Build to climax at 75% mark')"
    ],
    "neverInclude": [
      "Universal avoidances (e.g., 'Never use passive voice')",
      "Style restrictions (e.g., 'Never exceed 3 sentences without break')"
    ],
    "optimalStructure": {
      "hookSection": "0-10 seconds: [energy level, pace, promise]",
      "bodySection": "10-40 seconds: [teaching style, example pattern, progression]",
      "closeSection": "40-60 seconds: [summary style, CTA approach, energy]"
    },
    "detailedScriptFormula": {
      "step1": "[00:00-00:03] Open with [HOOK_TYPE] hook using HIGH energy. Say 'If you're [PROBLEM], I'll show you [SOLUTION]'",
      "step2": "[00:03-00:05] Quick transition. Say 'Listen' or 'Alright' to maintain attention",
      "step3": "[00:05-00:08] State credibility fast. Say 'After [TIME] of [EXPERTISE], I discovered...'",
      "step4": "[00:08-00:10] Promise specific value. Say 'In the next [TIME], you'll learn [BENEFIT]'",
      "step5": "[00:10-00:15] First main point. Say 'The first thing is [POINT]' with example",
      "step6": "[00:15-00:20] Second main point. Say 'Next, you need to [ACTION]' with specifics",
      "step7": "[00:20-00:25] Third main point or client story. Say 'My client [ACHIEVED] by [METHOD]'",
      "step8": "[00:25-00:30] Address objection. Say 'You might think [OBJECTION], but [COUNTER]'",
      "step9": "[00:30-00:35] Reinforce with data. Say '[NUMBER]% of people who [ACTION] get [RESULT]'",
      "step10": "[00:35-00:40] Create comparison. Say 'Most people [WRONG_WAY], but you should [RIGHT_WAY]'",
      "step11": "[00:40-00:45] Summarize key points. Say 'Remember: [POINT1], [POINT2], [POINT3]'",
      "step12": "[00:45-00:50] Create urgency. Say 'Only [NUMBER] spots' or 'Limited time'",
      "step13": "[00:50-00:55] Strong CTA. Say 'Comment [WORD] below' or 'Link in bio'",
      "step14": "[00:55-00:60] Final hook/tease. Say 'In my next video, I'll show you [NEXT_VALUE]'"
    },
    "universalApplicationExample": "To apply to ANY topic: Replace [PROBLEM] with your audience's pain point, [SOLUTION] with your method, [PROOF_TYPE] with your credibility (story/stats/results), [STRUCTURE_TYPE] with list/comparison/journey, etc."
  }
}

Analyze with forensic precision. Remember: The goal is to create a UNIVERSAL VOICE SYSTEM that can be applied to ANY topic.

VALIDATION TEST: Every template you extract should work equally well for:
- Teaching someone to cook pasta
- Explaining cryptocurrency
- Motivating fitness routines
- Reviewing a product
- Sharing business advice

If a pattern only works for the creator's specific domain, it's TOO SPECIFIC. Extract the underlying universal structure instead.

Example:
❌ TOO SPECIFIC: "This workout will transform your body"
✅ UNIVERSAL: "This [METHOD] will transform your [DESIRED_OUTCOME]"

CRITICAL REQUIREMENTS - YOUR RESPONSE WILL BE INVALID WITHOUT THESE:

✅ HOOK EXTRACTION REQUIREMENTS:
- You MUST include ${scriptsToAnalyze.length} hooks in "allHooksExtracted" array
- Each hook MUST have: scriptNumber, originalHook (exact quote), universalTemplate, type, trigger
- DO NOT skip any scripts - extract from Script 1, Script 2, Script 3... up to Script ${scriptsToAnalyze.length}

✅ STEP-BY-STEP FORMULA REQUIREMENTS:
- You MUST include "detailedScriptFormula" inside "scriptGenerationRules"
- It MUST contain EXACTLY 14 steps (step1 through step14)
- Each step MUST have: time range, action, template phrase
- This is NOT OPTIONAL - the formula MUST be included

✅ JSON FORMAT REQUIREMENTS:
- Return ONLY valid JSON (no markdown, no code blocks)
- Use numbers not strings for numeric values
- Ensure complete JSON from opening { to closing }

FINAL CHECK BEFORE RESPONDING:
□ Does "allHooksExtracted" have at least ${scriptsToAnalyze.length} entries?
□ Does "scriptGenerationRules" contain "detailedScriptFormula"?
□ Does "detailedScriptFormula" have all 14 steps?
□ Is each hook's "originalHook" an exact quote from the transcript?

Scripts to analyze (${transcripts.length} total):
${transcripts.map((t, i) => `---SCRIPT ${i + 1}---\n${t}`).join("\n\n")}

FINAL REMINDER: Return ONLY the JSON object. No additional text before or after.`;
    };

    // Create simplified prompt for fallback
    const createSimplifiedPrompt = (transcripts: string[]): string => {
      return `RETURN ONLY VALID JSON.

Analyze these ${transcripts.length} scripts and return a JSON object with these required fields:

{
  "voiceProfile": { "tone": "string", "personality": "string", "style": "string" },
  "linguisticFingerprint": { "vocabulary": [], "patterns": [], "uniqueExpressions": [] },
  "allHooksExtracted": [
    { "scriptNumber": 1, "originalHook": "exact text", "universalTemplate": "template", "type": "hook type", "trigger": "emotion" }
  ],
  "scriptGenerationRules": {
    "detailedScriptFormula": {
      "structure": "basic structure",
      "elements": []
    }
  }
}

Scripts:
${transcripts.map((t, i) => `Script ${i + 1}: ${t.substring(0, 200)}...`).join("\n")}`;
    };

    // Perform analysis with retry logic
    try {
      const analysis = await generateAnalysisWithRetry();

      // Log success metrics
      console.log("✅ Voice analysis completed successfully");
      console.log("📊 Analysis metrics:");
      console.log(`  - Hooks extracted: ${analysis.allHooksExtracted?.length ?? 0}`);
      console.log(`  - Voice profile: ${analysis.voiceProfile ? "Complete" : "Missing"}`);
      console.log(
        `  - Script formula: ${analysis.scriptGenerationRules?.detailedScriptFormula ? "Present" : "Missing"}`,
      );

      return NextResponse.json(analysis);
    } catch (error) {
      console.error("❌ Voice analysis failed after all attempts:", error);

      return NextResponse.json(
        {
          error: "Analysis failed after multiple attempts",
          primaryError: error instanceof Error ? error.message : "Unknown error",
          suggestions: [
            "Try with fewer transcripts (3-5 instead of 10)",
            "Check transcript quality and length",
            "Retry the request after a short delay",
          ],
          debug: {
            transcriptsProvided: scriptsToAnalyze.length,
            totalCharacters: scriptsToAnalyze.join("").length,
          },
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Voice analysis error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to analyze voice patterns",
      },
      { status: 500 },
    );
  }
}
