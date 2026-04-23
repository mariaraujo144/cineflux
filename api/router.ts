import { authRouter } from "./auth-router";
import { projectRouter } from "./project-router";
import { moduleRouter } from "./module-router";
import { webhookRouter } from "./webhook-router";
import { planRouter, subscriptionRouter } from "./plan-router";
import { bobRouter } from "./bob-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  project: projectRouter,
  module: moduleRouter,
  webhook: webhookRouter,
  plan: planRouter,
  subscription: subscriptionRouter,
  bob: bobRouter,
});

export type AppRouter = typeof appRouter;
