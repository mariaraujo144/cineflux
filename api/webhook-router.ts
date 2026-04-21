import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { webhookLogs, projects } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const webhookRouter = createRouter({
  // Receber webhooks de Bob (Make/Claude)
  receiveBob: publicQuery
    .input(
      z.object({
        eventType: z.string(),
        projectSlug: z.string().optional(),
        telegramChatId: z.string().optional(),
        payload: z.record(z.string(), z.any()),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      let projectId: number | undefined;
      if (input.projectSlug) {
        const project = await db.query.projects.findFirst({
          where: eq(projects.slug, input.projectSlug),
        });
        projectId = project?.id;
      }

      await db.insert(webhookLogs).values({
        source: "bob_make",
        projectId,
        eventType: input.eventType,
        payload: input.payload,
        status: "received",
      });

      return { received: true };
    }),

  // Receber webhooks de Manus (sites gerados)
  receiveManus: publicQuery
    .input(
      z.object({
        eventType: z.string(),
        projectSlug: z.string(),
        moduleType: z.enum(["approval_sites", "ppm_builder", "script_breakdown"]),
        externalUrl: z.string().url(),
        externalId: z.string().optional(),
        payload: z.record(z.string(), z.any()).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const project = await db.query.projects.findFirst({
        where: eq(projects.slug, input.projectSlug),
      });
      if (!project) throw new Error("Project not found");

      // Log do webhook
      await db.insert(webhookLogs).values({
        source: "manus_sites",
        projectId: project.id,
        eventType: input.eventType,
        payload: input.payload ?? {},
        status: "processed",
        processedAt: new Date(),
      });

      return { received: true, projectId: project.id };
    }),

  // Receber webhooks de Tally (formulários)
  receiveTally: publicQuery
    .input(
      z.object({
        eventType: z.string(),
        payload: z.record(z.string(), z.any()),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      await db.insert(webhookLogs).values({
        source: "tally_forms",
        eventType: input.eventType,
        payload: input.payload,
        status: "received",
      });

      return { received: true };
    }),

  // Listar logs (admin)
  list: publicQuery.query(async () => {
    return getDb().query.webhookLogs.findMany({
      orderBy: desc(webhookLogs.createdAt),
      limit: 100,
    });
  }),
});
