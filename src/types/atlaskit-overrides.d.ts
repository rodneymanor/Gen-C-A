import 'csstype';

declare module '@atlaskit/tokens' {
  export function token(path: string, fallback?: string): string;
}
