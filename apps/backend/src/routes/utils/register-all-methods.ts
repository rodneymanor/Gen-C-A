import type { NextFunction, Request, Response, Router } from 'express';

const METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options'] as const;
type HttpMethod = (typeof METHODS)[number];

type Handler = (req: Request, res: Response) => Promise<void> | void;

type MethodRegistrar = {
  [K in HttpMethod]: Router[K];
};

export function registerAllMethods(router: Router, path: string, handler: Handler) {
  const typedRouter = router as Router & MethodRegistrar;

  METHODS.forEach((method) => {
    typedRouter[method](path, async (req: Request, res: Response, next: NextFunction) => {
      try {
        // For clients using GET/DELETE/PATCH without a JSON body, merge query params into the body
        const upperMethod = req.method.toUpperCase();
        if (['GET', 'DELETE', 'HEAD', 'OPTIONS'].includes(upperMethod)) {
          const existingBody = req.body ?? {};
          const isBodyEmpty =
            existingBody == null ||
            (typeof existingBody === 'object' && !Array.isArray(existingBody) && Object.keys(existingBody).length === 0);
          if (isBodyEmpty && req.query && typeof req.query === 'object') {
            req.body = { ...(existingBody as Record<string, unknown>), ...(req.query as Record<string, unknown>) };
          }
        }

        await handler(req, res);
      } catch (error) {
        next(error);
      }
    });
  });
}
