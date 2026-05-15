import { getDb } from "../api/queries/connection";
import { plans } from "./schema";

async function seed() {
  const db = getDb();
  console.log("Seeding CineFlux plans...");

  const existing = await db.select().from(plans);
  if (existing.length > 0) {
    console.log("Plans already seeded, skipping.");
    process.exit(0);
  }

  await db.insert(plans).values([
    {
      slug: "starter",
      name: "CineFlux Starter",
      description: "Perfeito para freelancers e produtoras pequenas",
      priceMonthly: 9900,
      maxProjects: 5,
      maxMediaPerProject: 50,
      maxTeamMembers: 3,
      modulesEnabled: ["approval_sites", "bob_tasks", "schedule"],
      stripePriceId: "price_starter",
      isActive: true,
    },
    {
      slug: "pro",
      name: "CineFlux Pro",
      description: "Para produtoras médias e agências",
      priceMonthly: 24900,
      maxProjects: 20,
      maxMediaPerProject: 200,
      maxTeamMembers: 10,
      modulesEnabled: ["approval_sites", "bob_tasks", "schedule", "ppm_builder", "od"],
      stripePriceId: "price_pro",
      isActive: true,
    },
    {
      slug: "studio",
      name: "CineFlux Studio",
      description: "Para agências grandes e produtoras de alto volume",
      priceMonthly: 59900,
      maxProjects: -1,
      maxMediaPerProject: -1,
      maxTeamMembers: -1,
      modulesEnabled: ["approval_sites", "bob_tasks", "schedule", "ppm_builder", "od", "script_breakdown"],
      stripePriceId: "price_studio",
      isActive: true,
    },
  ]);

  console.log("Plans seeded: Starter, Pro, Studio");
  process.exit(0);
}

seed();
