/**
 * JSON parsing utilities with error recovery and validation
 */

/**
 * Parse JSON with automatic error recovery attempts
 * Tries to fix common JSON syntax issues before failing
 */
export function parseJsonWithRecovery(content: string): any {
  // First, try standard parsing
  try {
    return JSON.parse(content);
  } catch (error) {
    console.log("🔧 Attempting JSON repair...");

    // Remove any markdown code blocks if present
    let fixed = content
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    // Try to fix common JSON issues
    fixed = fixed
      .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
      .replace(/:\s*'([^']*)'/g, ':"$1"') // Replace single quotes with double
      // eslint-disable-next-line no-useless-escape
      .replace(/:\s*([^",\[{][^,}\]]*[^,}\]\s])/g, (match: string, value: string) => {
        // Quote unquoted string values, but not booleans/numbers/null
        if (value === "true" || value === "false" || value === "null" || !isNaN(value)) {
          return match;
        }
        return `:"${value.trim()}"`;
      });

    // Try parsing the fixed version
    try {
      return JSON.parse(fixed);
    } catch {
      console.log("🔧 Basic repair failed, attempting truncation...");

      // Find the last complete object/array
      const lastValidBrace = Math.max(fixed.lastIndexOf("}"), fixed.lastIndexOf("]"));

      if (lastValidBrace > 0) {
        // Try to parse up to the last valid closing brace
        fixed = fixed.substring(0, lastValidBrace + 1);

        // Balance the braces
        const openBraces = (fixed.match(/\{/g) ?? []).length;
        const closeBraces = (fixed.match(/\}/g) ?? []).length;
        const openBrackets = (fixed.match(/\[/g) ?? []).length;
        const closeBrackets = (fixed.match(/\]/g) ?? []).length;

        // Add missing closing braces/brackets
        fixed += "}}".repeat(Math.max(0, openBraces - closeBraces));
        fixed += "]]".repeat(Math.max(0, openBrackets - closeBrackets));

        try {
          return JSON.parse(fixed);
        } catch {
          console.log("❌ JSON repair failed after truncation");
        }
      }
    }

    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Validate that the analysis response contains all required fields
 */
export function validateAnalysisResponse(analysis: any): boolean {
  if (!analysis || typeof analysis !== "object") {
    console.log("❌ Analysis is not an object");
    return false;
  }

  const required = ["voiceProfile", "linguisticFingerprint", "allHooksExtracted", "scriptGenerationRules"];

  for (const field of required) {
    if (!analysis[field]) {
      console.log(`❌ Missing required field: ${field}`);
      return false;
    }
  }

  // Validate hooks array
  if (!Array.isArray(analysis.allHooksExtracted)) {
    console.log("❌ allHooksExtracted is not an array");
    return false;
  }

  if (analysis.allHooksExtracted.length === 0) {
    console.log("⚠️ allHooksExtracted array is empty");
    // This might be valid in some cases, so we just warn
  }

  // Validate script formula
  if (!analysis.scriptGenerationRules?.detailedScriptFormula) {
    console.log("❌ Missing detailedScriptFormula");
    return false;
  }

  // Validate voice profile structure
  if (!analysis.voiceProfile || typeof analysis.voiceProfile !== "object") {
    console.log("❌ Invalid voiceProfile structure");
    return false;
  }

  return true;
}

/**
 * Extract JSON from mixed content (text with JSON embedded)
 */
export function extractJsonFromContent(content: string): string | null {
  // Try to find JSON between common delimiters
  const patterns = [
    /\{[\s\S]*\}/, // Everything between first { and last }
    /```json\s*([\s\S]*?)```/, // JSON in markdown code block
    /```\s*([\s\S]*?)```/, // Any code block
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const extracted = match[1] ?? match[0];
      try {
        JSON.parse(extracted);
        return extracted;
      } catch {
        // Continue to next pattern
      }
    }
  }

  return null;
}

/**
 * Create a partial response with default values for missing fields
 */
export function createPartialResponse(partial: any): any {
  const defaults = {
    voiceProfile: {
      tone: "conversational",
      personality: "engaging",
      style: "natural",
    },
    linguisticFingerprint: {
      vocabulary: [],
      patterns: [],
      uniqueExpressions: [],
    },
    allHooksExtracted: [],
    scriptGenerationRules: {
      detailedScriptFormula: {
        structure: "standard",
        elements: [],
      },
    },
  };

  return {
    ...defaults,
    ...partial,
    voiceProfile: {
      ...defaults.voiceProfile,
      ...(partial?.voiceProfile ?? {}),
    },
    linguisticFingerprint: {
      ...defaults.linguisticFingerprint,
      ...(partial?.linguisticFingerprint ?? {}),
    },
    scriptGenerationRules: {
      ...defaults.scriptGenerationRules,
      ...(partial?.scriptGenerationRules ?? {}),
      detailedScriptFormula: {
        ...defaults.scriptGenerationRules.detailedScriptFormula,
        ...(partial?.scriptGenerationRules?.detailedScriptFormula ?? {}),
      },
    },
  };
}
