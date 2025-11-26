import { MenuItem } from "@/types/dashboard";
import {
  BarChart3,
  DollarSign,
  Users,
  ArrowUpRight,
  Settings,
  Package,
  Truck,
  FileSpreadsheet,
  Banknote,
  RotateCcw,
  Upload,
} from "lucide-react";
import axiosInstance from "@/lib/api/axiosInstance";


export const menuItems: MenuItem[] = [
  { icon: BarChart3, label: "Dashboard", href: "/dashboard", active: true },
  { icon: DollarSign, label: "Sales", href: "/sales" },
  { icon: Upload, label: "Bulk Sales", href: "/bulk-sales" },
  { icon: Users, label: "Parties", href: "/parties" },
  { icon: ArrowUpRight, label: "Expenses", href: "/expenses" },
  { icon: Truck, label: "Purchases", href: "/purchases" },
  { icon: Banknote, label: "Payments", href: "/payments" },
  { icon: RotateCcw, label: "Returns", href: "/returns" },
  { icon: Package, label: "Products", href: "/products" },
  { icon: FileSpreadsheet, label: "Reports", href: "/reports" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export const fetchTransactions = async (from?: Date, to?: Date) => {
  const params = new URLSearchParams();
  if (from) {
    params.append('from', from.toISOString());
  }
  if (to) {
    params.append('to', to.toISOString());
  }
  
  const response = await axiosInstance.get(`/stats/recent-transactions?${params}`);
  if (response.status !== 200) {
    throw new Error('Failed to fetch transactions');
  }
  return response.data.transactions;
};
