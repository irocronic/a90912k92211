import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { createFailureRateLimiter, getClientAddress } from "./rateLimit";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

const adminLoginFailureLimiter = createFailureRateLimiter({
  windowMs: 10 * 60_000,
  maxFailures: 5,
  blockMs: 30 * 60_000,
});

function respondAdminLoginRateLimited(res: Response, retryAfterMs: number) {
  res.setHeader("Retry-After", String(Math.max(1, Math.ceil(retryAfterMs / 1000))));
  res.status(429).json({
    error: "Çok fazla hatalı giriş denemesi yapıldı. Lütfen daha sonra tekrar deneyin.",
  });
}

export function registerOAuthRoutes(app: Express) {
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    const clientKey = `admin-login:${getClientAddress(req)}`;
    const blockedStatus = adminLoginFailureLimiter.isBlocked(clientKey);
    if (blockedStatus.blocked) {
      respondAdminLoginRateLimited(res, blockedStatus.retryAfterMs);
      return;
    }

    const username =
      typeof req.body?.username === "string" ? req.body.username.trim() : "";
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    if (!username || !password) {
      const attempt = adminLoginFailureLimiter.registerFailure(clientKey);
      if (attempt.blocked) {
        respondAdminLoginRateLimited(res, attempt.retryAfterMs);
        return;
      }
      res.status(400).json({ error: "Kullanıcı adı ve şifre zorunludur." });
      return;
    }

    if (!ENV.adminUsername || !ENV.adminPassword) {
      res.status(500).json({ error: "Admin credentials are not configured." });
      return;
    }

    if (username !== ENV.adminUsername || password !== ENV.adminPassword) {
      const attempt = adminLoginFailureLimiter.registerFailure(clientKey);
      if (attempt.blocked) {
        respondAdminLoginRateLimited(res, attempt.retryAfterMs);
        return;
      }
      res.status(401).json({ error: "Kullanıcı adı veya şifre hatalı." });
      return;
    }

    try {
      const openId = ENV.ownerOpenId || `admin:${ENV.adminUsername}`;

      await db.upsertUser({
        openId,
        name: ENV.adminUsername,
        email: null,
        loginMethod: "local-password",
        role: "super_admin",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name: ENV.adminUsername,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      adminLoginFailureLimiter.reset(clientKey);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("[Auth] Admin login failed", error);
      res.status(500).json({ error: "Admin login failed" });
    }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
