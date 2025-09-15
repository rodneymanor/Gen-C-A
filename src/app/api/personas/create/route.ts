import { NextRequest, NextResponse } from "next/server";

import { getAdminDb, isAdminInitialized } from "@/lib/firebase-admin";
import { authenticateWithFirebaseToken } from "@/lib/firebase-auth-helpers";

interface VoiceAnalysis {
  voiceProfile: {
    distinctiveness: string;
    complexity: string;
    primaryStyle: string;
  };
  hookReplicationSystem?: {
    primaryHookType: string;
    hookTemplates: Array<{
      template: string;
      type: string;
      frequency: number;
      effectiveness: string;
      emotionalTrigger: string;
      realExamples: string[];
      newExamples: string[];
    }>;
    hookProgression: {
      structure: string;
      avgWordCount: number;
      timing: string;
      examples: string[];
    };
    hookRules: string[];
  };
  linguisticFingerprint: {
    avgSentenceLength: number;
    vocabularyTier: {
      simple: number;
      moderate: number;
      advanced: number;
    };
    topUniqueWords: string[];
    avoidedWords: string[];
    grammarQuirks: string[];
  };
  transitionPhrases: {
    conceptBridges: string[];
    enumeration: string[];
    topicPivots: string[];
    softeners: string[];
  };
  microPatterns: {
    fillers: string[];
    emphasisWords: string[];
    numberPatterns: string;
    timeReferences: string[];
  };
  scriptGenerationRules?: {
    mustInclude: string[];
    neverInclude: string[];
    optimalStructure: {
      hookSection: string;
      bodySection: string;
      closeSection: string;
    };
    formulaForNewScript: string;
  };
  signatureMoves: Array<{
    move: string;
    description: string;
    frequency: string;
    placement: string;
    verbatim: string[];
  }>;
}

type CreationStatus = "pending" | "videos_collected" | "analyzed" | "created";

interface CreatePersonaRequest {
  name: string;
  description?: string;
  platform?: string;
  username?: string;
  analysis?: VoiceAnalysis; // optional to allow saving partial progress
  tags?: string[];
  creationStatus?: CreationStatus; // track multi-step workflow state
  videoUrls?: string[]; // optional context when saving after videos step
}

export async function POST(request: NextRequest) {
  console.log("📝 [Create Persona API] Request received");

  try {
    // Authenticate with Firebase token like other pages
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const authResult = await authenticateWithFirebaseToken(token);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body: CreatePersonaRequest = await request.json();
    const { name, description, platform, username, analysis, tags = [], creationStatus, videoUrls } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Determine workflow status
    const inferredStatus: CreationStatus = creationStatus
      ? creationStatus
      : analysis
        ? "created"
        : "pending";

    console.log(`📝 [Create Persona API] Creating persona: ${name}`);

    if (!isAdminInitialized) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
    }

    const adminDb = getAdminDb();
    const now = new Date().toISOString();

    // Create persona document (allow drafts without full analysis)
    const personaData: any = {
      userId: authResult.user.uid,
      name: name.trim(),
      description: description?.trim() ?? "",
      platform: platform?.toLowerCase() ?? "tiktok",
      username: username?.trim() ?? "",
      // Only include analysis when provided
      ...(analysis ? { analysis } : {}),
      tags,
      // Only set active when explicitly created
      status: inferredStatus === "created" ? "active" : "draft",
      creationStatus: inferredStatus,
      ...(videoUrls && videoUrls.length ? { videoUrls } : {}),
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
      lastUsedAt: null,
      // Additional metadata for organization (only if analysis present)
      ...(analysis
        ? {
            voiceStyle: analysis.voiceProfile.primaryStyle,
            distinctiveness: analysis.voiceProfile.distinctiveness,
            complexity: analysis.voiceProfile.complexity,
            hasHookSystem: !!analysis.hookReplicationSystem,
            hasScriptRules: !!analysis.scriptGenerationRules,
            signatureMoveCount: analysis.signatureMoves.length,
          }
        : {}),
    };

    const docRef = await adminDb.collection("personas").add(personaData);

    console.log(`✅ [Create Persona API] Persona created with ID: ${docRef.id}`);

    return NextResponse.json({
      success: true,
      personaId: docRef.id,
      persona: {
        id: docRef.id,
        ...personaData,
      },
    });
  } catch (error) {
    console.error("❌ [Create Persona API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to create persona",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
