import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { plans, subscriptions } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const planRouter = createRouter({
  list: publicQuery.query(async () => {
    return getDb().query.plans.findMany({
      where: eq(plans.isActive, true),
      orderBy: plans.priceMonthly,
    });
  }),

  getBySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return getDb().query.plans.findFirst({
        where: eq(plans.slug, input.slug),
      });
    }),
});

export const subscriptionRouter = createRouter({
  mySubscription: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const subs = await db.query.subscriptions.findMany({
      where: eq(subscriptions.userId, ctx.user.id),
      orderBy: desc(subscriptions.createdAt),
      with: { plan: true },
    });
    return subs[0] ?? null;
  }),

  create: authedQuery
    .input(z.object({ planId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      // Placeholder para Stripe — em produção, criar customer + subscription no Stripe
      const [{ id }] = await db
        .insert(subscriptions)
        .values({
          userId: ctx.user.id,
          planId: input.planId,
          status: "trialing",
        })
        .$returningId();

      return db.query.subscriptions.findFirst({
        where: eq(subscriptions.id, id),
        with: { plan: true },
      });
    }),

  updateStatus: authedQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["active", "canceled", "past_due", "trialing", "paused"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const sub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.id, input.id),
      });
      if (!sub || (sub.userId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new Error("Unauthorized");
      }
      await db.update(subscriptions).set({ status: input.status }).where(eq(subscriptions.id, input.id));
      return { success: true };
    }),
});
