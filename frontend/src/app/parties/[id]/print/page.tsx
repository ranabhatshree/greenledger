"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader } from "@/components/ui/loader";
import axiosInstance from "@/lib/api/axiosInstance";
import { getPartyById, type Party } from "@/lib/api/parties";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";

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
    type: "Sale" | "Expense" | "Purchase" | "Payment" | "Returns" | "Returns: Credit Note" | "Returns: Debit Note" | "Rcpt" | undefined;
    id: string;
    invoiceNumber?: string;
    runningBalance?: number;
}

function PartyPrintContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [party, setParty] = useState<Party | null>(null);
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
    const [fromDate, setFromDate] = useState<Date | null>(null);
    const [toDate, setToDate] = useState<Date | null>(null);
    const [businessInfo, setBusinessInfo] = useState({
        name: process.env.NEXT_PUBLIC_BUSINESS_NAME || "Green Ledger",
        address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "Kathmandu, Nepal"
    });

    // Format the date range for display
    const formattedDateRange = useMemo(() => {
        if (!fromDate || !toDate) return "";
        const fromStr = format(fromDate, "MMM dd, yyyy");
        const toStr = format(toDate, "MMM dd, yyyy");
        return `${fromStr} to ${toStr}`;
    }, [fromDate, toDate]);

    // Date formatter for the updated format
    const formatTableDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return format(date, "MMM dd, yyyy");
        } catch (e) {
            return dateStr;
        }
    };

    const fetchPartyDetails = async () => {
        try {
            const response = await getPartyById(params.id as string);
            setParty(response.party);
        } catch (error) {
            console.error("Error fetching party details:", error);
        }
    };

    const fetchLedgerEntries = async () => {
        try {
            if (!fromDate || !toDate) return;
            
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
                    type: entry.type || "Sale",
                    runningBalance: balance
                };
            });
            setLedgerEntries(formattedEntries);
        } catch (error) {
            console.error("Error fetching ledger entries:", error);
        }
    };

    useEffect(() => {
        // Get query parameters for date range
        const fromDateParam = searchParams.get('from');
        const toDateParam = searchParams.get('to');
        
        // Set dates from query parameters or default to current year
        if (fromDateParam) {
            setFromDate(new Date(fromDateParam));
        } else {
            setFromDate(new Date(new Date().getFullYear(), 0, 1));
        }
        
        if (toDateParam) {
            setToDate(new Date(toDateParam));
        } else {
            setToDate(new Date(new Date().getFullYear(), 11, 31));
        }
    }, [searchParams]);

    useEffect(() => {
        if (!fromDate || !toDate || !params.id) return;
        
        const fetchData = async () => {
            setLoading(true);
            await Promise.all([fetchPartyDetails(), fetchLedgerEntries()]);
            setLoading(false);
            
            // Auto print after loading
            setTimeout(() => {
                window.print();
            }, 1000);
        };

        fetchData();
    }, [params.id, fromDate, toDate]);

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

    if (loading) return <Loader />;
    if (!party) return <div>Party not found</div>;

    return (
        <div className="print-container p-4">
            {/* Header */}
            <div className="party-header text-center">
                <h1 className="text-3xl font-bold">{businessInfo.name}</h1>
                <h2 className="text-xl font-bold">{businessInfo.address}</h2>
                <h2 className="text-2xl font-bold mt-2">LEDGER</h2>
                <div className="date-range">(From {formattedDateRange})</div>
                <div className="mb-4 font-bold">Account : {party.name} {party.panNumber ? `(PAN: ${party.panNumber})` : ""}</div>
            </div>

            {/* Ledger Table */}
            <Table className="condensed-table">
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-center">Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-center">Vch. No.</TableHead>
                        <TableHead>Particulars</TableHead>
                        <TableHead className="text-right">Debit(Rs.)</TableHead>
                        <TableHead className="text-right">Credit(Rs.)</TableHead>
                        <TableHead className="text-right">Balance(Rs.)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {ledgerEntries.map((entry, index) => (
                        <TableRow key={index} className="compact-row">
                            <TableCell className="p-1">{formatTableDate(entry.date)}</TableCell>
                            <TableCell className="p-1">
                                {entry.type?.startsWith("Returns:") ? entry.type : entry.type || "Sale"}
                            </TableCell>
                            <TableCell className="p-1 text-center">{entry.invoiceNumber}</TableCell>
                            <TableCell className="p-1">{entry.particulars}</TableCell>
                            <TableCell className="p-1 text-right">
                                {entry.drAmount ? entry.drAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : ""}
                            </TableCell>
                            <TableCell className="p-1 text-right">
                                {entry.crAmount ? entry.crAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : ""}
                            </TableCell>
                            <TableCell className="p-1 text-right">
                                {entry.runningBalance !== undefined ? 
                                    `${Math.abs(entry.runningBalance).toLocaleString('en-IN', { maximumFractionDigits: 2 })} ${entry.runningBalance < 0 ? 'DR' : 'CR'}` 
                                    : ""}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={4} className="text-right font-bold">Total</TableCell>
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
                </TableFooter>
            </Table>
        </div>
    );
}

export default function PartyPrintPage() {
    return (
        <Suspense fallback={<Loader />}>
            <PartyPrintContent />
        </Suspense>
    );
} 