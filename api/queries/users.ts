import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { InsertUser } from "@db/schema";
import { getDb } from "./connection";
import { env } from "../lib/env";

export async function findUserByUnionId(unionId: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.unionId, unionId))
    .limit(1);
  return rows.at(0);
}

export async function findUserByGoogleId(googleId: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.googleId, googleId))
    .limit(1);
  return rows.at(0);
}

export async function upsertUser(data: InsertUser) {
  const values = { ...data };
  const updateSet: Partial<InsertUser> = {
    lastSignInAt: new Date(),
    ...data,
  };

  if (
    values.role === undefined &&
    values.unionId &&
    values.unionId === env.ownerUnionId
  ) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  await getDb()
    .insert(schema.users)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });
}

export async function upsertGoogleUser(data: {
  googleId: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  googleAccessToken: string;
  googleRefreshToken: string | null;
}) {
  const unionId = `google_${data.googleId}`;
  const existing = await findUserByGoogleId(data.googleId);

  const values: InsertUser = {
    unionId,
    googleId: data.googleId,
    name: data.name,
    email: data.email,
    avatar: data.avatar,
    googleAccessToken: data.googleAccessToken,
    googleRefreshToken: data.googleRefreshToken,
    lastSignInAt: new Date(),
  };

  if (!existing) {
    // New user
    if (unionId === env.ownerUnionId) {
      values.role = "admin";
    }
    await getDb().insert(schema.users).values(values);
  } else {
    // Update existing
    await getDb()
      .update(schema.users)
      .set({
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        googleAccessToken: data.googleAccessToken,
        googleRefreshToken: data.googleRefreshToken,
        lastSignInAt: new Date(),
      })
      .where(eq(schema.users.id, existing.id));
  }

  return findUserByGoogleId(data.googleId);
}
