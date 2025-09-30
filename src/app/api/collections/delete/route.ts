import type { NextRequest } from "next/server";

import { forwardToBackend } from "../../_utils/backend-proxy";

export async function DELETE(request: NextRequest) {
  return forwardToBackend(request, "/api/collections/delete");
}

export async function POST(request: NextRequest) {
  return forwardToBackend(request, "/api/collections/delete");
}
