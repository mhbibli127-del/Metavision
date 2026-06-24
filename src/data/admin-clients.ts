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

export function formatAiQueries(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatPayment(value: number): string {
  return `${value.toLocaleString("en-US")} ₼`;
}
