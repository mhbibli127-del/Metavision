export type AdminClientPlan = "Gold" | "Standard";
export type AdminClientStatus = "Active" | "Pending" | "Trial" | "Waiting" | "Test";

export type AdminClient = {
  id: string;
  company: string;
  plan: AdminClientPlan;
  startDate: string;
  monthlyPayment: number;
  aiQueries: number;
  status: AdminClientStatus;
};

export const adminClients: AdminClient[] = [
  {
    id: "1",
    company: "Tech Solutions AZ",
    plan: "Gold",
    startDate: "01.01.2025",
    monthlyPayment: 680,
    aiQueries: 4120,
    status: "Active",
  },
  {
    id: "2",
    company: "BakuMart LLC",
    plan: "Standard",
    startDate: "15.01.2025",
    monthlyPayment: 390,
    aiQueries: 1850,
    status: "Pending",
  },
  {
    id: "3",
    company: "Caspian Group",
    plan: "Gold",
    startDate: "01.01.2025",
    monthlyPayment: 680,
    aiQueries: 8300,
    status: "Active",
  },
  {
    id: "4",
    company: "AzerFinance",
    plan: "Standard",
    startDate: "20.01.2025",
    monthlyPayment: 390,
    aiQueries: 2940,
    status: "Waiting",
  },
  {
    id: "5",
    company: "Prime Digital",
    plan: "Standard",
    startDate: "20.01.2025",
    monthlyPayment: 390,
    aiQueries: 940,
    status: "Test",
  },
  {
    id: "6",
    company: "Baku Telecom",
    plan: "Gold",
    startDate: "01.02.2025",
    monthlyPayment: 680,
    aiQueries: 5200,
    status: "Active",
  },
];

export const adminClientCounts = {
  total: 48,
  gold: 27,
  standard: 21,
};

export function formatAiQueries(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatPayment(value: number): string {
  return `${value.toLocaleString("en-US")} ₼`;
}
