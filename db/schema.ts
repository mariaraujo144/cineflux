import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  boolean,
  json,
  index,
} from "drizzle-orm/mysql-core";

// ─── Users (já existente, mantido) ───
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Plans (Starter, Pro, Studio) ───
export const plans = mysqlTable("plans", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(), // starter, pro, studio
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  priceMonthly: int("priceMonthly").notNull(), // em centavos (R$ 9900 = R$ 99,00)
  maxProjects: int("maxProjects").notNull(), // -1 = ilimitado
  maxMediaPerProject: int("maxMediaPerProject").notNull(), // -1 = ilimitado
  maxTeamMembers: int("maxTeamMembers").default(5).notNull(),
  modulesEnabled: json("modulesEnabled").$type<string[]>(), // quais módulos liberados
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;

// ─── Subscriptions ───
export const subscriptions = mysqlTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  planId: bigint("planId", { mode: "number", unsigned: true }).notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  status: mysqlEnum("status", ["active", "canceled", "past_due", "trialing", "paused"]).default("trialing").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("subs_user_idx").on(table.userId),
  stripeSubIdx: index("subs_stripe_sub_idx").on(table.stripeSubscriptionId),
}));

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ─── Projects / Jobs ───
export const projects = mysqlTable("projects", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(), // dono
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  clientName: varchar("clientName", { length: 255 }), // nome do cliente (Nike, Itaú)
  campaignName: varchar("campaignName", { length: 255 }), // nome da campanha
  status: mysqlEnum("status", [
    "draft",
    "pre_production",
    "in_production",
    "post_production",
    "delivered",
    "archived",
  ]).default("draft").notNull(),
  language: varchar("language", { length: 10 }).default("pt").notNull(), // pt, en, es, fr, hi
  isPublic: boolean("isPublic").default(false).notNull(),
  googleDriveFolderId: varchar("googleDriveFolderId", { length: 255 }), // pasta no Drive do cliente
  googleSheetId: varchar("googleSheetId", { length: 255 }), // planilha mestre do job
  telegramChatId: varchar("telegramChatId", { length: 255 }), // se criado via Bob
  metadata: json("metadata").$type<Record<string, any>>(), // dados extras flexíveis
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  userIdx: index("proj_user_idx").on(table.userId),
  statusIdx: index("proj_status_idx").on(table.status),
  slugIdx: index("proj_slug_idx").on(table.slug),
}));

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ─── Project Modules (módulos ativos por projeto) ───
export const projectModules = mysqlTable("projectModules", {
  id: serial("id").primaryKey(),
  projectId: bigint("projectId", { mode: "number", unsigned: true }).notNull(),
  moduleType: mysqlEnum("moduleType", [
    "approval_sites",    // sites de aprovação (Manus)
    "bob_tasks",         // tarefas do Bob (Claude/Make)
    "ppm_builder",       // PPM
    "schedule",          // cronograma
    "od",                // ordem do dia
    "script_breakdown",  // decupagem de roteiro
  ]).notNull(),
  status: mysqlEnum("status", ["disabled", "active", "pending", "error"]).default("disabled").notNull(),
  externalUrl: varchar("externalUrl", { length: 500 }), // URL do site gerado pelo Manus, planilha, etc.
  externalId: varchar("externalId", { length: 255 }), // ID externo (Manus, Make, etc.)
  config: json("config").$type<Record<string, any>>(), // config específica do módulo
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  projectIdx: index("pmod_project_idx").on(table.projectId),
  typeIdx: index("pmod_type_idx").on(table.moduleType),
}));

export type ProjectModule = typeof projectModules.$inferSelect;
export type InsertProjectModule = typeof projectModules.$inferInsert;

// ─── Project Members (equipe do projeto) ───
export const projectMembers = mysqlTable("projectMembers", {
  id: serial("id").primaryKey(),
  projectId: bigint("projectId", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("userId", { mode: "number", unsigned: true }), // pode ser user do sistema ou null (convite por email)
  email: varchar("email", { length: 320 }), // para convites externos
  name: varchar("name", { length: 255 }),
  role: mysqlEnum("role", ["owner", "admin", "editor", "viewer"]).default("viewer").notNull(),
  invitedAt: timestamp("invitedAt").defaultNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  projectIdx: index("pmem_project_idx").on(table.projectId),
  userIdx: index("pmem_user_idx").on(table.userId),
}));

export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertProjectMember = typeof projectMembers.$inferInsert;

// ─── Webhook Logs (integração com Make/Claude/Manus) ───
export const webhookLogs = mysqlTable("webhookLogs", {
  id: serial("id").primaryKey(),
  source: mysqlEnum("source", ["bob_make", "manus_sites", "tally_forms", "manual"]).notNull(),
  projectId: bigint("projectId", { mode: "number", unsigned: true }),
  eventType: varchar("eventType", { length: 100 }).notNull(), // project.created, task.added, site.generated
  payload: json("payload").$type<Record<string, any>>().notNull(),
  status: mysqlEnum("status", ["received", "processed", "failed", "ignored"]).default("received").notNull(),
  errorMessage: text("errorMessage"),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  projectIdx: index("wh_project_idx").on(table.projectId),
  sourceIdx: index("wh_source_idx").on(table.source),
}));

export type WebhookLog = typeof webhookLogs.$inferSelect;
export type InsertWebhookLog = typeof webhookLogs.$inferInsert;
