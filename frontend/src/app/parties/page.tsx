"use client";

import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import Link from "next/link";
import { PartyTable } from "@/components/parties/party-table";
import { cn } from "@/lib/utils";
import { getAllParties, type Party } from "@/lib/api/parties";

type PartyType = "All Parties" | "Vendors" | "Suppliers";

// Using Party type from API

const tabs: PartyType[] = ["All Parties", "Vendors", "Suppliers"];

export default function PartiesPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PartyType>("All Parties");
  const [allUsers, setAllUsers] = useState<Party[]>([]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const parties = await getAllParties();
      setAllUsers(parties);
    } catch (error) {
      console.error("Error fetching parties:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (activeTab === "All Parties") return allUsers;
    
    const role = activeTab.toLowerCase().slice(0, -1);
    return allUsers.filter(user => user.role === role);
  }, [activeTab, allUsers]);

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <Loader />;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Parties</h1>
          <Link href="/parties/create">
            <Button 
              className="bg-green-600 hover:bg-green-700 flex items-center"
              aria-label="Add Party"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Party
            </Button>
          </Link>
        </div>

        <div className="flex gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab}
              variant="outline"
              className={cn(
                "bg-white",
                activeTab === tab && "bg-blue-50 text-blue-600"
              )}
              onClick={() => setActiveTab(tab)}
              aria-label={`Filter by ${tab}`}
              aria-pressed={activeTab === tab}
            >
              {tab}
            </Button>
          ))}
        </div>

        <PartyTable data={filteredUsers} filterType={activeTab} />
      </div>
    </AppLayout>
  );
} 