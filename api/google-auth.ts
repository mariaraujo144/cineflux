import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import * as cookie from "cookie";
import { env } from "./lib/env";
import { getSessionCookieOptions } from "./lib/cookies";
import { Session } from "@contracts/constants";
import { Errors } from "@contracts/errors";
import { signSessionToken, verifySessionToken } from "./kimi/session";
import { findUserByGoogleId, upsertGoogleUser } from "./queries/users";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

// Scopes needed for CineFlux:
// - openid + email + profile: basic user info
// - drive.readonly: read Drive folders
// - spreadsheets: read/write Sheets
// - calendar: read/write Calendar events
// - drive.file: create files in Drive
const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/drive.file",
].join(" ");

export function getGoogleOAuthUrl(origin: string): string {
  const redirectUri = `${origin}/api/oauth/google/callback`;
  const state = btoa(redirectUri);

  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", env.googleClientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_SCOPES);
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");

  return url.toString();
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface GoogleUserInfo {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
}

async function exchangeGoogleCode(code: string, redirectUri: string): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: env.googleClientId,
    client_secret: env.googleClientSecret,
    redirect_uri: redirectUri,
  });

  const resp = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Google token exchange failed (${resp.status}): ${text}`);
  }

  return resp.json() as Promise<GoogleTokenResponse>;
}

async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const resp = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Google userinfo failed (${resp.status}): ${text}`);
  }

  return resp.json() as Promise<GoogleUserInfo>;
}

export async function authenticateGoogleRequest(headers: Headers) {
  const cookies = cookie.parse(headers.get("cookie") || "");
  const token = cookies[Session.cookieName];
  if (!token) {
    throw Errors.forbidden("Invalid authentication token.");
  }
  const claim = await verifySessionToken(token);
  if (!claim) {
    throw Errors.forbidden("Invalid authentication token.");
  }

  // Try finding by unionId first, then by googleId
  let user = null;
  if (claim.unionId) {
    const { findUserByUnionId } = await import("./queries/users");
    user = await findUserByUnionId(claim.unionId);
  }
  if (!user && claim.googleId) {
    user = await findUserByGoogleId(claim.googleId);
  }

  if (!user) {
    throw Errors.forbidden("User not found. Please re-login.");
  }
  return user;
}

export function createGoogleOAuthCallbackHandler() {
  return async (c: Context) => {
    const code = c.req.query("code");
    const state = c.req.query("state");
    const error = c.req.query("error");
    const errorDescription = c.req.query("error_description");

    if (error) {
      console.error("[Google OAuth] Error:", error, errorDescription);
      if (error === "access_denied") {
        return c.redirect("/login?error=access_denied", 302);
      }
      return c.json({ error, error_description: errorDescription }, 400);
    }

    if (!code || !state) {
      return c.json({ error: "code and state are required" }, 400);
    }

    if (!env.googleClientId || !env.googleClientSecret) {
      console.error("[Google OAuth] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
      return c.json({ error: "Google OAuth not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file." }, 500);
    }

    try {
      const redirectUri = atob(state);
      const tokenResp = await exchangeGoogleCode(code, redirectUri);
      const userInfo = await getGoogleUserInfo(tokenResp.access_token);

      const user = await upsertGoogleUser({
        googleId: userInfo.sub,
        name: userInfo.name,
        email: userInfo.email,
        avatar: userInfo.picture,
        googleAccessToken: tokenResp.access_token,
        googleRefreshToken: tokenResp.refresh_token ?? null,
      });

      if (!user) {
        throw new Error("Failed to upsert Google user");
      }

      // Generate session token with googleId
      const token = await signSessionToken({
        unionId: `google_${userInfo.sub}`,
        googleId: userInfo.sub,
        clientId: env.googleClientId,
      });

      const cookieOpts = getSessionCookieOptions(c.req.raw.headers);
      setCookie(c, Session.cookieName, token, {
        ...cookieOpts,
        maxAge: Session.maxAgeMs / 1000,
      });

      return c.redirect("/dashboard", 302);
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error);
      return c.json({ error: "Google OAuth callback failed", details: String(error) }, 500);
    }
  };
}
