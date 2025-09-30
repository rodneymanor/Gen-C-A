import type { NextRequest } from "next/server";

import { forwardToBackend } from "../../_utils/backend-proxy";

export async function GET(request: NextRequest) {
  return forwardToBackend(request, "/api/brand-voices/list");
}
