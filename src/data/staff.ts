export type StaffRole = "manager" | "chef" | "waiter" | "bartender" | "host" | "cleaner";
export type StaffStatus = "active" | "inactive" | "on_leave";

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  role: StaffRole;
  status: StaffStatus;
  hireDate: Date;
  salary?: number;
  avatar?: string;
}

export const staffRoles: { value: StaffRole; label: string }[] = [
  { value: "manager", label: "Manager" },
  { value: "chef", label: "Chef" },
  { value: "waiter", label: "Waiter" },
  { value: "bartender", label: "Bartender" },
  { value: "host", label: "Host" },
  { value: "cleaner", label: "Cleaner" },
];

export const staffStatuses: { value: StaffStatus; label: string; color: string }[] = [
  { value: "active", label: "Active", color: "green" },
  { value: "inactive", label: "Inactive", color: "gray" },
  { value: "on_leave", label: "On Leave", color: "orange" },
];
