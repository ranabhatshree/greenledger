import { LucideIcon } from "lucide-react";

export interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
  active?: boolean;
}

export interface SalesDataPoint {
  name: string;
  value: number;
}

export interface Vendor {
  name: string;
  growth: string;
  amount: string;
}

export interface Transaction {
  id: number;
  type: string;
  description: string;
  date: string;
  amount: string;
  status: "Completed" | "Paid" | "Pending" | "Received";
}