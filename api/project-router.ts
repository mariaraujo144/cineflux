import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { projects, projectModules, projectMembers, subscriptions } from "@db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 100);
}

export const projectRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    return getDb().query.projects.findMany({
      where: eq(projects.userId, userId),
      orderBy: desc(projects.createdAt),
      with: {
        modules: true,
        members: true,
      },
    });
  }),

  listAll: authedQuery.query(async ({ ctx }) => {
    // Admin pode ver todos; usuário normal vê os seus + os que é membro
    const db = getDb();
    const userId = ctx.user.id;

    if (ctx.user.role === "admin") {
      return db.query.projects.findMany({
        orderBy: desc(projects.createdAt),
        with: { modules: true, members: true },
      });
    }

    const ownProjects = await db.query.projects.findMany({
      where: eq(projects.userId, userId),
      orderBy: desc(projects.createdAt),
      with: { modules: true, members: true },
    });

    const memberProjects = await db
      .select({ projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(eq(projectMembers.userId, userId));

    if (memberProjects.length === 0) return ownProjects;

    const memberProjectIds = memberProjects.map((m) => m.projectId);
    const otherProjects = await db.query.projects.findMany({
      where: sql`${projects.id} IN (${sql.join(memberProjectIds)})`,
      orderBy: desc(projects.createdAt),
      with: { modules: true, members: true },
    });

    return [...ownProjects, ...otherProjects];
  }),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, input.id),
        with: { modules: true, members: true },
      });

      if (!project) throw new Error("Project not found");

      // Verificar permissão
      const isOwner = project.userId === ctx.user.id;
      const isMember = project.members.some((m) => m.userId === ctx.user.id);
      const isAdmin = ctx.user.role === "admin";

      if (!isOwner && !isMember && !isAdmin) {
        throw new Error("Unauthorized");
      }

      return project;
    }),

  bySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const project = await db.query.projects.findFirst({
        where: eq(projects.slug, input.slug),
        with: { modules: true, members: { with: { user: true } } },
      });
      if (!project) throw new Error("Project not found");
      if (!project.isPublic) {
        // Para projetos privados, requer auth — simplificado aqui
        throw new Error("Project is private");
      }
      return project;
    }),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        clientName: z.string().max(255).optional(),
        campaignName: z.string().max(255).optional(),
        status: z.enum(["draft", "pre_production", "in_production", "post_production", "delivered", "archived"]).default("draft"),
        language: z.string().max(10).default("pt"),
        modules: z.array(z.enum(["approval_sites", "bob_tasks", "ppm_builder", "schedule", "od", "script_breakdown"])).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Verificar limite de projetos pelo plano
      const userSubs = await db.query.subscriptions.findMany({
        where: eq(subscriptions.userId, userId),
        with: { plan: true },
      });
      const activeSub = userSubs.find((s) => s.status === "active" || s.status === "trialing");
      const plan = activeSub?.plan;

      const userProjects = await db
        .select({ count: count() })
        .from(projects)
        .where(eq(projects.userId, userId));
      const currentCount = userProjects[0]?.count ?? 0;

      if (plan && plan.maxProjects !== -1 && currentCount >= plan.maxProjects) {
        throw new Error("Project limit reached for your plan");
      }

      // Gerar slug único
      let slug = generateSlug(input.name);
      const existing = await db.query.projects.findFirst({
        where: eq(projects.slug, slug),
      });
      if (existing) {
        slug = `${slug}-${Date.now()}`;
      }

      const [{ id }] = await db
        .insert(projects)
        .values({
          userId,
          slug,
          name: input.name,
          clientName: input.clientName,
          campaignName: input.campaignName,
          status: input.status,
          language: input.language,
        })
        .$returningId();

      const newProject = await db.query.projects.findFirst({
        where: eq(projects.id, id),
      });

      // Criar módulos ativos
      const modulesToEnable = input.modules ?? ["approval_sites", "bob_tasks"];
      for (const modType of modulesToEnable) {
        await db.insert(projectModules).values({
          projectId: id,
          moduleType: modType,
          status: "active",
        });
      }

      // Adicionar criador como owner
      await db.insert(projectMembers).values({
        projectId: id,
        userId,
        role: "owner",
        name: ctx.user.name ?? "Owner",
        email: ctx.user.email ?? undefined,
      });

      return newProject;
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        clientName: z.string().max(255).optional().nullable(),
        campaignName: z.string().max(255).optional().nullable(),
        status: z.enum(["draft", "pre_production", "in_production", "post_production", "delivered", "archived"]).optional(),
        language: z.string().max(10).optional(),
        isPublic: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;

      const project = await db.query.projects.findFirst({
        where: eq(projects.id, id),
      });
      if (!project) throw new Error("Project not found");
      if (project.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      await db.update(projects).set(data).where(eq(projects.id, id));
      return db.query.projects.findFirst({ where: eq(projects.id, id), with: { modules: true } });
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, input.id),
      });
      if (!project) throw new Error("Project not found");
      if (project.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      await db.delete(projects).where(eq(projects.id, input.id));
      return { success: true };
    }),

  stats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const totalProjects = await db
      .select({ count: count() })
      .from(projects)
      .where(eq(projects.userId, userId));

    const statusCounts = await db
      .select({ status: projects.status, count: count() })
      .from(projects)
      .where(eq(projects.userId, userId))
      .groupBy(projects.status);

    const activeModules = await db
      .select({ count: count() })
      .from(projectModules)
      .where(
        and(
          sql`${projectModules.projectId} IN (SELECT id FROM ${projects} WHERE userId = ${userId})`,
          eq(projectModules.status, "active"),
        ),
      );

    return {
      totalProjects: totalProjects[0]?.count ?? 0,
      statusCounts: statusCounts.reduce((acc, s) => ({ ...acc, [s.status]: s.count }), {} as Record<string, number>),
      activeModules: activeModules[0]?.count ?? 0,
    };
  }),
});
