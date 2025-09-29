import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'openapi', 'openapi.yaml');
  const spec = await fs.readFile(filePath, 'utf8');

  return new NextResponse(spec, {
    status: 200,
    headers: {
      'Content-Type': 'text/yaml; charset=utf-8',
      'Cache-Control': 'public, max-age=300'
    }
  });
}
