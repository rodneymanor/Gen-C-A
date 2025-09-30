import type { NextRequest } from "next/server";

import { forwardToBackend } from "../../_utils/backend-proxy";

export async function POST(request: NextRequest) {
  return forwardToBackend(request, "/api/collections/update");
}

export async function PATCH(request: NextRequest) {
  return forwardToBackend(request, "/api/collections/update");
}
