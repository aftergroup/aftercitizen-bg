/**
 * Shared HTTP helpers. Same-origin only -- no CORS headers are emitted.
 */

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export class HttpError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export async function readJson(request) {
  const text = await request.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError('Request body is not valid JSON', 400);
  }
}

/**
 * Wrap a handler so HttpErrors become clean responses and anything else
 * becomes a 500 without leaking internals to the caller.
 */
export function handler(fn) {
  return async (request, context) => {
    try {
      return await fn(request, context);
    } catch (error) {
      if (error instanceof HttpError) {
        return json({ error: error.message }, error.status);
      }
      console.error('[function] unhandled error:', error);
      return json({ error: 'Internal error' }, 500);
    }
  };
}
