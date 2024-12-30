"use client";

import { DataTable, Column } from "@/components/ui/data-table";
import { Building2, EyeIcon, Eye, Pencil, User, FileInputIcon, PencilIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import Link from "next/link";

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  panNumber: string;
  address: string;
  partyMargin: number;
}

interface Party {
  id: string;
  name: string;
  email: string;
  type: "Vendor" | "Supplier";
  contact: string;
  address: string;
  balance: string;
  status: "Active" | "Inactive";
  partyMargin: number;
}

interface PartyTableProps {
  data: User[];
  filterType: "All Parties" | "Vendors" | "Suppliers";
}

export function PartyTable({ data, filterType }: PartyTableProps) {
  // Transform API data to match Party interface
  const transformedData: Party[] = data.map(user => ({
    id: user._id,
    name: user.name,
    email: user.email,
    type: user.role === "vendor" ? "Vendor" : "Supplier",
    contact: user.phone,
    address: user.address,
    balance: "NPR 0",
    status: "Active",
    partyMargin: user.partyMargin,
  }));

  const columns: Column<Party>[] = [
    {
      header: "Name",
      cell: (party) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-100 p-2">
            {party.type === "Vendor" ? (
              <Building2 className="h-6 w-6 text-gray-600" />
            ) : (
              <User className="h-6 w-6 text-gray-600" />
            )}
          </div>
          <div>
            <Link 
              href={`/parties/${party.id}`}
              className="text-blue-600 hover:underline"
            >
              <p className="font-medium">{party.name}</p>
            </Link>
            <p className="text-sm text-gray-600">{party.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Type",
      cell: (party) => (
        <span className={cn(
          "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
          party.type === "Vendor" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
        )}>
          {party.type}
        </span>
      ),
    },
    {
      header: "Contact",
      accessorKey: "contact",
    },
    {
      header: "PAN Number",
      cell: (party) => {
        const user = data.find(u => u._id === party.id);
        return user?.panNumber || "-";
      }
    },
    {
      header: "Party Margin",
      accessorKey: "partyMargin",
    },
    {
      header: "Address",
      accessorKey: "address",
    },
    {
      header: "Status",
      cell: (party) => (
        <span className={cn(
          "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
          party.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        )}>
          {party.status}
        </span>
      ),
    }
  ];

  return (
    <DataTable<Party>
      data={transformedData}
      columns={columns}
      searchPlaceholder="Search parties..."
    />
  );
} 