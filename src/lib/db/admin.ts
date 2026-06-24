import { connectDb } from "@/lib/mongodb";
import { AdminClientModel, PlatformMetricModel, OrganizationModel, docs } from "@/lib/models";

export async function getAdminClients() {
  await connectDb();
  const [clients, orgs] = await Promise.all([
    AdminClientModel.find().sort({ createdAt: -1 }).lean(),
    OrganizationModel.find().sort({ createdAt: -1 }).lean(),
  ]);

  const planMap: Record<string, "Trial" | "Standard" | "Gold" | "Enterprise"> = {
    TRIAL: "Trial",
    STANDARD: "Standard",
    GOLD: "Gold",
    ENTERPRISE: "Enterprise",
  };
  const statusMap: Record<string, "Active" | "Inactive" | "Waiting" | "Trial"> = {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    SUSPENDED: "Waiting",
    TRIAL: "Trial",
  };

  const fromClients = docs(clients as Array<{ _id: string } & Record<string, unknown>>).map((c) => ({
    id: c.id,
    company: String(c.company),
    plan: planMap[String(c.plan)] ?? "Gold",
    startDate: new Date(String(c.startDate)).toLocaleDateString("en-GB"),
    monthlyPayment: Number(c.monthlyPayment),
    aiQueries: Number(c.aiQueries),
    status: statusMap[String(c.status)] as "Active" | "Pending" | "Trial" | "Waiting" | "Test",
  }));

  const orgIds = new Set(fromClients.map((c) => c.id));
  for (const org of docs(orgs as Array<{ _id: string } & Record<string, unknown>>)) {
    if (orgIds.has(org.id)) continue;
    fromClients.push({
      id: org.id,
      company: String(org.name),
      plan: planMap[String(org.plan)] ?? "Standard",
      startDate: new Date(String(org.createdAt ?? Date.now())).toLocaleDateString("en-GB"),
      monthlyPayment: String(org.plan).toUpperCase() === "GOLD" ? 680 : 390,
      aiQueries: 0,
      status: "Active",
    });
  }

  return fromClients;
}

export async function getPlatformAnalytics() {
  await connectDb();
  const [metric, orgs] = await Promise.all([
    PlatformMetricModel.findOne().sort({ recordedAt: -1 }).lean(),
    OrganizationModel.find().lean(),
  ]);
  const clients = docs(await AdminClientModel.find().lean());
  const orgList = docs(orgs as Array<{ _id: string } & Record<string, unknown>>);
  const fromClients = await getAdminClients();

  if (!metric) {
    const goldCount = orgList.filter((o) => String(o.plan).toUpperCase() === "GOLD").length;
    const standardCount = orgList.filter((o) => String(o.plan).toUpperCase() === "STANDARD").length;
    const monthlyRevenue = fromClients.reduce((sum, c) => sum + Number(c.monthlyPayment), 0);
    return {
      dashboardStats: {
        activeClients: orgList.length || fromClients.length,
        activeClientsGrowth: 8,
        monthlyRevenue,
        revenueGrowth: 12,
        aiQueries: "0",
        aiQueriesGrowth: 5,
        onboardingRate: 72,
        onboardingGrowth: 4,
      },
      planAllocation: { gold: goldCount, standard: standardCount },
      monthlyIncome: [],
      incomeSummary: {
        monthlyTotal: monthlyRevenue,
        goldTotal: Math.round(monthlyRevenue * 0.57),
        standardTotal: Math.round(monthlyRevenue * 0.25),
        goldCount,
        standardCount,
        goldUnitPrice: 690,
        standardUnitPrice: 390,
        growthPercent: 12,
        trialIncome: 0,
      },
      weeklyPolls: [],
    };
  }

  const goldCount = clients.filter((c) => c.plan === "GOLD" || c.plan === "ENTERPRISE").length;
  const standardCount = clients.filter((c) => c.plan === "STANDARD").length;

  const aiQ = Number(metric.aiQueries);

  return {
    dashboardStats: {
      activeClients: Number(metric.activeClients),
      activeClientsGrowth: Number(metric.activeClientsGrowth),
      monthlyRevenue: Number(metric.monthlyRevenue),
      revenueGrowth: Number(metric.revenueGrowth),
      aiQueries: aiQ >= 1000 ? `${(aiQ / 1000).toFixed(1)}k` : String(aiQ),
      aiQueriesGrowth: Number(metric.aiQueriesGrowth),
      onboardingRate: Number(metric.onboardingRate),
      onboardingGrowth: Number(metric.onboardingGrowth),
    },
    planAllocation: {
      gold: goldCount || Number(metric.goldPlanCount),
      standard: standardCount || Number(metric.standardPlanCount),
    },
    monthlyIncome: [
      { month: "Jan", value: 18200 },
      { month: "Feb", value: 21400 },
      { month: "Mar", value: 19800 },
      { month: "Apr", value: 25600 },
      { month: "May", value: 28900 },
      { month: "Jun", value: Number(metric.monthlyRevenue) },
    ],
    incomeSummary: {
      monthlyTotal: Number(metric.monthlyRevenue),
      goldTotal: Math.round(Number(metric.monthlyRevenue) * 0.57),
      standardTotal: Math.round(Number(metric.monthlyRevenue) * 0.25),
      goldCount,
      standardCount,
      goldUnitPrice: 690,
      standardUnitPrice: 390,
      growthPercent: Number(metric.revenueGrowth),
      trialIncome: 676,
    },
    weeklyPolls: [
      { day: "Mon", value: 62 },
      { day: "Tue", value: 78 },
      { day: "Wed", value: 71 },
      { day: "Thu", value: 85 },
      { day: "Fri", value: 92 },
      { day: "Sat", value: 88 },
      { day: "Sun", value: 74 },
    ],
  };
}
