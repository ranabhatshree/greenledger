"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import axiosInstance from "@/lib/api/axiosInstance";
import { format } from "date-fns";
import { TransactionTable } from "@/components/shared/transaction-table";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

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
    invoiceNumber?: string;
    runningBalance?: number;
}

export default function PartyDetailsPage() {
    const params = useParams();
    const router = useRouter();
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
            
            // Calculate running balance
            let balance = 0;
            const formattedEntries = entries.map((entry: any) => {
                const drAmount = entry.drAmount || 0;
                const crAmount = entry.crAmount || 0;
                balance = balance + crAmount - drAmount;
                
                return {
                    id: entry._id,
                    date: format(new Date(entry.date), "dd MMM yyyy"),
                    invoiceNumber: entry.invoiceNumber,
                    particulars: entry.particulars,
                    drAmount,
                    crAmount,
                    amount: entry.amount || entry.drAmount || entry.crAmount,
                    status: 'completed',
                    type: entry.type,
                    runningBalance: balance
                };
            });
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

    // Calculate totals for footer
    const { totalDebit, totalCredit, closingBalance } = useMemo(() => {
        let totalDebit = 0;
        let totalCredit = 0;
        
        ledgerEntries.forEach(entry => {
            totalDebit += entry.drAmount || 0;
            totalCredit += entry.crAmount || 0;
        });
        
        const closingBalance = totalCredit - totalDebit;
        
        return { totalDebit, totalCredit, closingBalance };
    }, [ledgerEntries]);

    // Footer for the table
    const tableFooter = (
        <TableRow>
            <TableCell colSpan={5} className="text-right font-bold">Total</TableCell>
            <TableCell className="text-right font-bold">{totalDebit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
            <TableCell className="text-right font-bold">{totalCredit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
            <TableCell className="text-right font-bold">
                <div>Closing Balance</div>
                <div>
                    {Math.abs(closingBalance).toLocaleString('en-IN', { maximumFractionDigits: 2 })} 
                    {closingBalance < 0 ? 'DR' : 'CR'}
                </div>
            </TableCell>
        </TableRow>
    );

    // Format the date range for display
    const formattedDateRange = useMemo(() => {
        if (!dateRange?.from) return "";
        
        const fromStr = format(dateRange.from, "dd/MM/yyyy");
        const toStr = dateRange.to ? format(dateRange.to, "dd/MM/yyyy") : fromStr;
        
        return `From ${fromStr} to ${toStr}`;
    }, [dateRange]);

    // Custom date formatter for the transaction table
    const formatTableDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const day = format(date, "dd");
            const month = format(date, "MMM").substring(0, 3);
            const year = format(date, "yyyy");
            
            // Only show in print view
            return (
                <>
                    <span className="hidden print:inline">
                        <div className="text-center">
                            <div>{day}</div>
                            <div>{month}</div>
                            <div>{year}</div>
                        </div>
                    </span>
                    <span className="print:hidden">{format(date, "dd MMM yyyy")}</span>
                </>
            );
        } catch (e) {
            return dateStr;
        }
    };

    const handlePrint = () => {
        // Navigate to print page with the same date range
        const fromStr = fromDate ? format(fromDate, "yyyy-MM-dd") : "";
        const toStr = toDate ? format(toDate, "yyyy-MM-dd") : "";
        router.push(`/parties/${params.id}/print?from=${fromStr}&to=${toStr}`);
    };

    if (loading) return <Loader />;
    if (!party) return <div>Party not found</div>;

    return (
        <AppLayout>
            <div className="flex flex-col gap-6">
                <h1 className="text-2xl font-bold print:hidden">Party Details</h1>

                {/* Print-only header */}
                <div className="hidden print:block party-header">
                    <h1>SAMJHANA SUPPLIERS</h1>
                    <h2>H.O.SAINAMAINA-03,MURGIYA, RUPANDEHI, BRANCH:- SHIVARAJ-05,CHANRAUTA, KAPILVASTU</h2>
                    <h2 className="text-center font-bold">LEDGER</h2>
                    <div className="date-range text-center">( {formattedDateRange} )</div>
                    <div className="text-center">Account : {party.name}</div>
                </div>

                {/* Regular view party details */}
                <Card className="p-6 print:hidden">
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
                    <div className="flex justify-between items-center mx-4 mb-4 relative z-10 print:hidden">
                        <DateRangePicker
                            from={dateRange?.from}
                            to={dateRange?.to}
                            onSelect={handleDateRangeChange}
                            className="w-auto min-w-[300px] max-w-[400px]"
                        />
                        <Button 
                            onClick={handlePrint}
                            className="flex items-center gap-2 print:hidden"
                            aria-label="Print ledger"
                        >
                            <Printer className="h-4 w-4" />
                            Print Ledger
                        </Button>
                    </div>

                    <TransactionTable
                        title="Ledger Entries"
                        data={ledgerEntries}
                        showType={true}
                        footer={tableFooter}
                        columns={[
                            {
                                header: "Date",
                                accessorKey: "date",
                                cell: (transaction: any) => formatTableDate(transaction.date)
                            },
                            {
                                header: "Type",
                                accessorKey: "type",
                                cell: (transaction: any) => transaction.type || "Sale"
                            },
                            {
                                header: "Vch. No.",
                                accessorKey: "invoiceNumber",
                            },
                            {
                                header: "Particulars",
                                accessorKey: "particulars",
                            },
                            {
                                header: "Narration",
                                accessorKey: "description",
                                cell: (transaction: any) => transaction.description || ""
                            },
                            {
                                header: "Debit(Rs.)",
                                accessorKey: "drAmount",
                                cell: (transaction: any) => {
                                    const amount = transaction.drAmount;
                                    return amount ? amount.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '';
                                }
                            },
                            {
                                header: "Credit(Rs.)",
                                accessorKey: "crAmount",
                                cell: (transaction: any) => {
                                    const amount = transaction.crAmount;
                                    return amount ? amount.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '';
                                }
                            },
                            {
                                header: "Balance(Rs.)",
                                accessorKey: "runningBalance",
                                cell: (transaction: any) => {
                                    const balance = transaction.runningBalance;
                                    if (balance === undefined) return '';
                                    
                                    // Get absolute value and format it
                                    const absBalance = Math.abs(balance).toLocaleString('en-IN', { maximumFractionDigits: 2 });
                                    
                                    // Add DR or CR suffix based on sign
                                    return balance < 0 ? `${absBalance} DR` : `${absBalance} CR`;
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
                    
                    {/* Print-only footer */}
                    <div className="hidden print:block ledger-footer">
                        <div className="text-right font-bold">
                            <span>Grand Total</span>
                            <span className="ml-10">{totalDebit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                            <span className="ml-10">{totalCredit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="text-right mt-2">
                            <span className="font-bold">Closing Balance</span>
                            <span className="ml-10 font-bold">
                                {Math.abs(closingBalance).toLocaleString('en-IN', { maximumFractionDigits: 2 })} 
                                {closingBalance < 0 ? 'DR' : 'CR'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
} 