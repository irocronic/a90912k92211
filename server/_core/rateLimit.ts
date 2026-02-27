import type { NextFunction, Request, Response } from "express";

type RateLimitState = {
  windowStart: number;
  count: number;
  blockedUntil: number;
  updatedAt: number;
};

type FailureState = {
  firstFailureAt: number;
  failures: number;
  blockedUntil: number;
  updatedAt: number;
};

type IpRateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  blockMs: number;
};

type FailureRateLimitOptions = {
  windowMs: number;
  maxFailures: number;
  blockMs: number;
};

const DEFAULT_STALE_MS = 24 * 60 * 60 * 1000;

export function getClientAddress(req: Request): string {
  return (
    req.ip ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

function toRetryAfterSeconds(ms: number): number {
  return Math.max(1, Math.ceil(ms / 1000));
}

function pruneMap<T extends { updatedAt: number }>(
  map: Map<string, T>,
  now: number,
  staleMs: number = DEFAULT_STALE_MS,
) {
  map.forEach((state, key) => {
    if (now - state.updatedAt > staleMs) {
      map.delete(key);
    }
  });
}

export function createIpRateLimitMiddleware(options: IpRateLimitOptions) {
  const store = new Map<string, RateLimitState>();
  let callsSincePrune = 0;

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = getClientAddress(req);
    const state = store.get(key) ?? {
      windowStart: now,
      count: 0,
      blockedUntil: 0,
      updatedAt: now,
    };

    if (state.blockedUntil > now) {
      const retryAfterMs = state.blockedUntil - now;
      res.setHeader("Retry-After", String(toRetryAfterSeconds(retryAfterMs)));
      res.status(429).json({
        error: "Too many requests. Please try again later.",
      });
      return;
    }

    if (now - state.windowStart >= options.windowMs) {
      state.windowStart = now;
      state.count = 0;
    }

    state.count += 1;
    state.updatedAt = now;

    if (state.count > options.maxRequests) {
      state.blockedUntil = now + options.blockMs;
      store.set(key, state);
      const retryAfterMs = state.blockedUntil - now;
      res.setHeader("Retry-After", String(toRetryAfterSeconds(retryAfterMs)));
      res.status(429).json({
        error: "Too many requests. Please try again later.",
      });
      return;
    }

    store.set(key, state);
    callsSincePrune += 1;
    if (callsSincePrune >= 1000) {
      pruneMap(store, now);
      callsSincePrune = 0;
    }

    next();
  };
}

export function createFailureRateLimiter(options: FailureRateLimitOptions) {
  const store = new Map<string, FailureState>();
  let callsSincePrune = 0;

  const isBlocked = (key: string) => {
    const now = Date.now();
    const state = store.get(key);
    if (!state || state.blockedUntil <= now) {
      return { blocked: false, retryAfterMs: 0 };
    }
    return {
      blocked: true,
      retryAfterMs: state.blockedUntil - now,
    };
  };

  const registerFailure = (key: string) => {
    const now = Date.now();
    const state = store.get(key) ?? {
      firstFailureAt: now,
      failures: 0,
      blockedUntil: 0,
      updatedAt: now,
    };

    if (state.blockedUntil > now) {
      return {
        blocked: true,
        retryAfterMs: state.blockedUntil - now,
      };
    }

    if (now - state.firstFailureAt > options.windowMs) {
      state.firstFailureAt = now;
      state.failures = 0;
    }

    state.failures += 1;
    state.updatedAt = now;

    if (state.failures >= options.maxFailures) {
      state.blockedUntil = now + options.blockMs;
      state.failures = 0;
    }

    store.set(key, state);
    callsSincePrune += 1;
    if (callsSincePrune >= 500) {
      pruneMap(store, now);
      callsSincePrune = 0;
    }

    return {
      blocked: state.blockedUntil > now,
      retryAfterMs: Math.max(0, state.blockedUntil - now),
    };
  };

  const reset = (key: string) => {
    store.delete(key);
  };

  return {
    isBlocked,
    registerFailure,
    reset,
  };
}
