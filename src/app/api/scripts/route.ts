import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

import type { CreateScriptRequest, Script, ScriptsResponse, ScriptResponse, UpdateScriptRequest } from "@/types/script";

const SCRIPTS_FILE = path.join(process.cwd(), "data", "scripts.json");

function ensureStore() {
  const dir = path.dirname(SCRIPTS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(SCRIPTS_FILE)) fs.writeFileSync(SCRIPTS_FILE, JSON.stringify({ scripts: [] }, null, 2));
}

function readScripts(): Script[] {
  ensureStore();
  try {
    const raw = fs.readFileSync(SCRIPTS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : Array.isArray(parsed.scripts) ? parsed.scripts : [];
  } catch {
    return [];
  }
}

function writeScripts(scripts: Script[]) {
  ensureStore();
  fs.writeFileSync(SCRIPTS_FILE, JSON.stringify({ scripts }, null, 2));
}

function genId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET() {
  const scripts = readScripts();
  return NextResponse.json({ success: true, scripts } satisfies ScriptsResponse);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateScriptRequest;
    const now = new Date().toISOString();

    const userId = "local"; // Optionally parse Authorization and set real UID
    const wordCount = (body.content || "").trim().split(/\s+/).filter(Boolean).length;

    const script: Script = {
      id: genId(),
      title: body.title || "Untitled Script",
      content: body.content || "",
      authors: "You",
      status: body.status ?? "draft",
      performance: { views: 0, engagement: 0 },
      category: body.category || "General",
      createdAt: now,
      updatedAt: now,
      viewedAt: now,
      duration: "0:30",
      tags: body.tags || [],
      fileType: "Script",
      summary: body.summary || (body.content || "").slice(0, 160),
      userId,
      approach: body.approach,
      voice: body.voice,
      originalIdea: body.originalIdea,
      targetLength: body.targetLength,
      source: body.source,
      scheduledDate: body.scheduledDate,
      platform: body.platform,
      isThread: body.isThread,
      threadParts: body.threadParts,
      wordCount,
      characterCount: (body.content || "").length,
    };

    const scripts = readScripts();
    scripts.unshift(script);
    writeScripts(scripts);

    return NextResponse.json({ success: true, script } satisfies ScriptResponse);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Invalid request" } satisfies ScriptResponse, { status: 400 });
  }
}

