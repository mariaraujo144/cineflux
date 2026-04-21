import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { projectModules, projects } from "@db/schema";
import { eq, and } from "drizzle-orm";

export const moduleRouter = createRouter({
  listByProject: authedQuery
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, input.projectId),
      });
      if (!project) throw new Error("Project not found");
      if (project.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      return db.query.projectModules.findMany({
        where: eq(projectModules.projectId, input.projectId),
      });
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["disabled", "active", "pending", "error"]).optional(),
        externalUrl: z.string().max(500).optional().nullable(),
        externalId: z.string().max(255).optional().nullable(),
        config: z.record(z.string(), z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;

      const mod = await db.query.projectModules.findFirst({
        where: eq(projectModules.id, id),
        with: { project: true },
      });
      if (!mod) throw new Error("Module not found");
      if (mod.project.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      await db.update(projectModules).set(data).where(eq(projectModules.id, id));
      return db.query.projectModules.findFirst({ where: eq(projectModules.id, id) });
    }),

  // Endpoint público para o Manus registrar um site gerado
  registerExternal: publicQuery
    .input(
      z.object({
        projectSlug: z.string(),
        moduleType: z.enum(["approval_sites", "bob_tasks", "ppm_builder", "schedule", "od", "script_breakdown"]),
        externalUrl: z.string().url(),
        externalId: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const project = await db.query.projects.findFirst({
        where: eq(projects.slug, input.projectSlug),
      });
      if (!project) throw new Error("Project not found");

      const existing = await db.query.projectModules.findFirst({
        where: and(
          eq(projectModules.projectId, project.id),
          eq(projectModules.moduleType, input.moduleType),
        ),
      });

      if (existing) {
        await db
          .update(projectModules)
          .set({
            externalUrl: input.externalUrl,
            externalId: input.externalId ?? existing.externalId,
            status: "active",
            lastSyncAt: new Date(),
          })
          .where(eq(projectModules.id, existing.id));
        return { updated: true, moduleId: existing.id };
      }

      const [{ id }] = await db
        .insert(projectModules)
        .values({
          projectId: project.id,
          moduleType: input.moduleType,
          status: "active",
          externalUrl: input.externalUrl,
          externalId: input.externalId,
          lastSyncAt: new Date(),
        })
        .$returningId();

      return { created: true, moduleId: id };
    }),
});
