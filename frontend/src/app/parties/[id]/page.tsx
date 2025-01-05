"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import axiosInstance from "@/lib/api/axiosInstance";
import { format } from "date-fns";
import { TransactionTable } from "@/components/shared/transaction-table";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

interface Party {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    panNumber: string;
    address: string;
}

interface LedgerEntry {
    _id: string;
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    particulars: string;
    drAmount: number;
    crAmount: number;
    amount: string;
    status: string;
    type: "Sale" | "Expense" | "Purchase" | "Payment" | undefined;
    id: string;
}

export default function PartyDetailsPage() {
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [party, setParty] = useState<Party | null>(null);
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), 0, 1), // Jan 1st of current year
        to: new Date(new Date().getFullYear(), 11, 31), // Dec 31st of current year
    });
    const [fromDate, setFromDate] = useState<Date>(new Date(new Date().getFullYear(), 0, 1));
    const [toDate, setToDate] = useState<Date>(new Date(new Date().getFullYear(), 11, 31));

    const handleDateRangeChange = (range: DateRange | undefined) => {
        setDateRange(range);
        if (range?.from) {
            setFromDate(range.from);
        }
        if (range?.to) {
            setToDate(range.to);
        }
    };

    const fetchPartyDetails = async () => {
        try {
            const response = await axiosInstance.get(`/auth/user/${params.id}`);
            setParty(response.data.user);
        } catch (error) {
            console.error("Error fetching party details:", error);
        }
    };

    const fetchLedgerEntries = async () => {
        try {
            const from = format(fromDate, "yyyy-MM-dd");
            const to = format(toDate, "yyyy-MM-dd");

            const response = await axiosInstance.get(
                `/ledgers/party/${params.id}?from=${from}&to=${to}`
            );
            const entries = response.data.data.entries;
            const formattedEntries = entries.map((entry: any) => ({
                id: entry._id,
                date: format(new Date(entry.date), "dd MMM yyyy"),
                invoiceNumber: entry.invoiceNumber,
                particulars: entry.particulars,
                drAmount: entry.drAmount,
                crAmount: entry.crAmount,
                amount: entry.amount || entry.drAmount || entry.crAmount,
                status: 'completed',
                type: entry.type
            }));
            setLedgerEntries(formattedEntries);
        } catch (error) {
            console.error("Error fetching ledger entries:", error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await Promise.all([fetchPartyDetails(), fetchLedgerEntries()]);
            setLoading(false);
        };

        if (params.id) {
            fetchData();
        }
    }, [params.id]);

    // Add this effect to refetch when dates change
    useEffect(() => {
        if (params.id) {
            fetchLedgerEntries();
        }
    }, [fromDate, toDate, params.id]);

    if (loading) return <Loader />;
    if (!party) return <div>Party not found</div>;

    return (
        <AppLayout>
            <div className="flex flex-col gap-6">
                <h1 className="text-2xl font-bold">Party Details</h1>

                <Card className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Name</label>
                            <p className="mt-1">{party.name}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Role</label>
                            <p className="mt-1 capitalize">{party.role}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Email</label>
                            <p className="mt-1">{party.email}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Phone</label>
                            <p className="mt-1">{party.phone}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">PAN Number</label>
                            <p className="mt-1">{party.panNumber}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Address</label>
                            <p className="mt-1">{party.address}</p>
                        </div>
                    </div>
                </Card>

                <div className="mt-4 lg:mt-6">
                <div className="flex-1 flex justify-center mx-4 relative z-10">
                    <DateRangePicker
                        from={dateRange?.from}
                        to={dateRange?.to}
                        onSelect={handleDateRangeChange}
                        className="w-auto min-w-[300px] max-w-[400px]"
                    />
                </div>

                    <TransactionTable
                        title="Ledger Entries"
                        data={ledgerEntries}
                        showType={true}
                        columns={[
                            {
                                header: "Date",
                                accessorKey: "date",
                            },
                            {
                                header: "Invoice Number",
                                accessorKey: "invoiceNumber",
                            },
                            {
                                header: "Particulars",
                                accessorKey: "particulars",
                            },
                            {
                                header: "DR Amount",
                                accessorKey: "drAmount",
                                cell: (transaction: any) => {
                                    const amount = transaction.drAmount;
                                    return amount ? amount.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '';
                                }
                            },
                            {
                                header: "CR Amount",
                                accessorKey: "crAmount",
                                cell: (transaction: any) => {
                                    const amount = transaction.crAmount;
                                    return amount ? amount.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '';
                                }
                            }
                        ]}
                        searchableColumns={[
                            {
                              id: "date",
                              value: (row: any) => row.date,
                            },
                            {
                              id: "invoiceNumber",
                              value: (row: any) => row.invoiceNumber || "",
                            }
                          ]}
                    />
                </div>
            </div>
        </AppLayout>
    );
} 