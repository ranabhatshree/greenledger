"use client";

import { DataTable, Column } from "@/components/ui/data-table";
import { Building2, Eye, Pencil, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import Link from "next/link";
import { type Party } from "@/lib/api/parties";
import { useState, useMemo } from "react";

interface PartyDisplay {
  id: string;
  name: string;
  email: string;
  type: "Vendor" | "Supplier";
  contact: string;
  address: string;
  balance: string;
  status: "Active" | "Inactive";
  partyMargin: number;
  panNumber: string;
}

interface PartyTableProps {
  data: Party[];
  filterType: "All Parties" | "Vendors" | "Suppliers";
}

export function PartyTable({ data, filterType }: PartyTableProps) {
  const [searchValue, setSearchValue] = useState("");

  // Transform API data to match Party interface
  const transformedData: PartyDisplay[] = data.map(party => ({
    id: party._id,
    name: party.name,
    email: party.email || "",
    type: party.role === "vendor" ? "Vendor" : "Supplier",
    contact: party.phone,
    address: party.address,
    balance: `NPR ${party.closingBalance.toLocaleString()}`,
    status: "Active",
    partyMargin: party.partyMargin,
    panNumber: party.panNumber,
  }));

  // Filter data based on search value
  const filteredData = useMemo(() => {
    if (!searchValue) return transformedData;
    
    const searchLower = searchValue.toLowerCase();
    return transformedData.filter(party => {
      return (
        party.name.toLowerCase().includes(searchLower) ||
        party.email.toLowerCase().includes(searchLower) ||
        party.contact?.toLowerCase().includes(searchLower) ||
        party.address?.toLowerCase().includes(searchLower) ||
        party.panNumber?.toLowerCase().includes(searchLower) ||
        party.type.toLowerCase().includes(searchLower)
      );
    });
  }, [transformedData, searchValue]);

  const columns: Column<PartyDisplay>[] = [
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
      accessorKey: "panNumber",
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
    },
    {
      header: "Actions",
      cell: (party) => (
        <div className="flex items-center gap-2">
          <Link href={`/parties/${party.id}`}>
            <Button variant="ghost" size="sm" aria-label="View party">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/parties/${party.id}/edit`}>
            <Button variant="ghost" size="sm" aria-label="Edit party">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ),
    }
  ];

  return (
    <DataTable<PartyDisplay>
      data={filteredData}
      columns={columns}
      searchPlaceholder="Search parties..."
      searchValue={searchValue}
      onSearchChange={setSearchValue}
    />
  );
} 