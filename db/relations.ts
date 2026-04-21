import { relations } from "drizzle-orm";
import {
  users,
  plans,
  subscriptions,
  projects,
  projectModules,
  projectMembers,
  webhookLogs,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  subscriptions: many(subscriptions),
  projectMemberships: many(projectMembers),
}));

export const plansRelations = relations(plans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
  plan: one(plans, { fields: [subscriptions.planId], references: [plans.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, { fields: [projects.userId], references: [users.id] }),
  modules: many(projectModules),
  members: many(projectMembers),
  webhooks: many(webhookLogs),
}));

export const projectModulesRelations = relations(projectModules, ({ one }) => ({
  project: one(projects, { fields: [projectModules.projectId], references: [projects.id] }),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, { fields: [projectMembers.projectId], references: [projects.id] }),
  user: one(users, { fields: [projectMembers.userId], references: [users.id] }),
}));

export const webhookLogsRelations = relations(webhookLogs, ({ one }) => ({
  project: one(projects, { fields: [webhookLogs.projectId], references: [projects.id] }),
}));
