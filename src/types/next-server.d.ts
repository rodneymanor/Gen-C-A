declare module 'next/server' {
  export class NextRequest extends Request {}

  export class NextResponse extends Response {
    static json<T = unknown>(data: T, init?: ResponseInit): Response;
    static redirect(url: string | URL, init?: number | ResponseInit): Response;
  }
}
