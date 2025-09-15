import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

import type { Script, ScriptResponse, UpdateScriptRequest } from "@/types/script";

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

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const scripts = readScripts();
  const script = scripts.find((s) => s.id === id);
  if (!script) return NextResponse.json({ success: false, error: "Not found" } satisfies ScriptResponse, { status: 404 });
  return NextResponse.json({ success: true, script } satisfies ScriptResponse);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const updates = (await request.json()) as UpdateScriptRequest;
    const scripts = readScripts();
    const idx = scripts.findIndex((s) => s.id === id);
    if (idx === -1) return NextResponse.json({ success: false, error: "Not found" } satisfies ScriptResponse, { status: 404 });

    const updated: Script = {
      ...scripts[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    } as Script;
    scripts[idx] = updated;
    writeScripts(scripts);

    return NextResponse.json({ success: true, script: updated } satisfies ScriptResponse);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Invalid request" } satisfies ScriptResponse, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const scripts = readScripts();
  const idx = scripts.findIndex((s) => s.id === id);
  if (idx === -1) return NextResponse.json({ success: false, error: "Not found" } satisfies ScriptResponse, { status: 404 });
  scripts.splice(idx, 1);
  writeScripts(scripts);
  return NextResponse.json({ success: true } satisfies ScriptResponse);
}

