"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader } from "@/components/ui/loader";
import axiosInstance from "@/lib/api/axiosInstance";
import { getPartyById, type Party } from "@/lib/api/parties";
import { getFiscalYears, type FiscalYear } from "@/lib/api/fiscalYears";
import { formatNepaliMiti } from "@/lib/nepali-date";
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
    type: string;
    id: string;
    invoiceNumber?: string;
    runningBalance?: number;
    isOpeningBalance?: boolean;
    miti?: string;
}

interface ClosingBalance {
    amount: number;
    type: "CR" | "DR";
}

function PartyPrintContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [party, setParty] = useState<Party | null>(null);
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
    const [closingBalance, setClosingBalance] = useState<ClosingBalance>({ amount: 0, type: "CR" });
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

    const resolveFiscalYearId = async (
        fiscalYearIdParam: string | null,
        from: string,
        to: string
    ): Promise<string | null> => {
        if (fiscalYearIdParam) return fiscalYearIdParam;

        try {
            const fiscalYears = await getFiscalYears();
            const matchingYear = fiscalYears.find((fy: FiscalYear) => {
                const fyFrom = format(new Date(fy.fromDate), "yyyy-MM-dd");
                const fyTo = format(new Date(fy.toDate), "yyyy-MM-dd");
                return fyFrom === from && fyTo === to;
            });
            return matchingYear?._id || null;
        } catch {
            return null;
        }
    };

    const fetchLedgerEntries = async (
        start: Date,
        end: Date,
        fiscalYearId?: string | null
    ) => {
        try {
            if (!start || !end) return;

            const from = format(start, "yyyy-MM-dd");
            const to = format(end, "yyyy-MM-dd");
            const resolvedFiscalYearId = fiscalYearId || await resolveFiscalYearId(null, from, to);

            const url = resolvedFiscalYearId
                ? `/ledgers/party/${params.id}?fiscal_year_id=${resolvedFiscalYearId}`
                : `/ledgers/party/${params.id}?from=${from}&to=${to}`;

            const response = await axiosInstance.get(url);
            const data = response.data.data;
            const entries = data.entries || [];

            if (resolvedFiscalYearId) {
                setClosingBalance(data.closing_balance || { amount: 0, type: "CR" });

                const formattedEntries = entries.map((entry: any, index: number) => ({
                    id: entry._id || `entry-${index}`,
                    date: format(new Date(entry.date), "dd MMM yyyy"),
                    miti: formatNepaliMiti(entry.date),
                    invoiceNumber: entry.invoiceNumber,
                    particulars: entry.particulars,
                    drAmount: entry.drAmount || 0,
                    crAmount: entry.crAmount || 0,
                    amount: entry.amount || entry.drAmount || entry.crAmount,
                    status: "completed",
                    type: entry.type || "Sale",
                    runningBalance: entry.runningBalance,
                    isOpeningBalance: entry.isOpeningBalance,
                }));
                setLedgerEntries(formattedEntries);
                return;
            }

            let balance = 0;
            const formattedEntries = entries.map((entry: any, index: number) => {
                const drAmount = entry.drAmount || 0;
                const crAmount = entry.crAmount || 0;
                balance = balance + crAmount - drAmount;

                return {
                    id: entry._id || `entry-${index}`,
                    date: format(new Date(entry.date), "dd MMM yyyy"),
                    miti: formatNepaliMiti(entry.date),
                    invoiceNumber: entry.invoiceNumber,
                    particulars: entry.particulars,
                    drAmount,
                    crAmount,
                    amount: entry.amount || entry.drAmount || entry.crAmount,
                    status: "completed",
                    type: entry.type || "Sale",
                    runningBalance: balance,
                };
            });
            setLedgerEntries(formattedEntries);
            setClosingBalance({
                amount: Math.abs(balance),
                type: balance < 0 ? "DR" : "CR",
            });
        } catch (error) {
            setLedgerEntries([]);
            setClosingBalance({ amount: 0, type: "CR" });
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

        const fiscalYearIdParam = searchParams.get("fiscal_year_id");

        const fetchData = async () => {
            setLoading(true);
            await Promise.all([
                fetchPartyDetails(),
                fetchLedgerEntries(fromDate, toDate, fiscalYearIdParam),
            ]);
            setLoading(false);

            setTimeout(() => {
                window.print();
            }, 1000);
        };

        fetchData();
    }, [params.id, fromDate, toDate, searchParams]);

    // Calculate totals for footer
    const { totalDebit, totalCredit } = useMemo(() => {
        let totalDebit = 0;
        let totalCredit = 0;

        ledgerEntries.forEach((entry) => {
            if (!entry.isOpeningBalance) {
                totalDebit += entry.drAmount || 0;
                totalCredit += entry.crAmount || 0;
            }
        });

        return { totalDebit, totalCredit };
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
                        <TableHead className="text-center">Miti</TableHead>
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
                            <TableCell className="p-1 text-center">{entry.miti}</TableCell>
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
                        <TableCell colSpan={5} className="text-right font-bold">Total</TableCell>
                        <TableCell className="text-right font-bold">{totalDebit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-bold">{totalCredit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-bold">
                            <div>Closing Balance</div>
                            <div>
                                {closingBalance.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}{" "}
                                {closingBalance.type}
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