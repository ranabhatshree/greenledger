"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import axiosInstance from "@/lib/api/axiosInstance";
import { getPartyById, type Party } from "@/lib/api/parties";
import { getFiscalYears, getActiveFiscalYear, type FiscalYear } from "@/lib/api/fiscalYears";
import { type OpeningBalance } from "@/lib/api/openingBalances";
import { format } from "date-fns";
import { TransactionTable } from "@/components/shared/transaction-table";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Printer, Pencil, Wallet } from "lucide-react";
import Link from "next/link";
import { OpeningBalanceModal } from "@/components/parties/opening-balance-modal";
import { formatNepaliMiti } from "@/lib/nepali-date";

interface LedgerEntry {
    _id?: string;
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    particulars: string;
    drAmount: number;
    crAmount: number;
    amount: string | number;
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

export default function PartyDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const partyId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [party, setParty] = useState<Party | null>(null);
    const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
    const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string>("");
    const [selectedFiscalYear, setSelectedFiscalYear] = useState<FiscalYear | null>(null);
    const [openingBalance, setOpeningBalance] = useState<OpeningBalance>({ amount: 0, type: "CR" });
    const [closingBalance, setClosingBalance] = useState<ClosingBalance>({ amount: 0, type: "CR" });
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
    const [openingBalanceModalOpen, setOpeningBalanceModalOpen] = useState(false);

    const fetchPartyDetails = async () => {
        try {
            const response = await getPartyById(partyId);
            setParty(response.party);
        } catch (error) {
            console.error("Error fetching party details:", error);
        }
    };

    const fetchFiscalYears = async () => {
        try {
            const [allYears, activeYear] = await Promise.all([
                getFiscalYears(),
                getActiveFiscalYear(),
            ]);
            setFiscalYears(allYears);

            if (activeYear) {
                setSelectedFiscalYearId(activeYear._id);
                setSelectedFiscalYear(activeYear);
            } else if (allYears.length > 0) {
                setSelectedFiscalYearId(allYears[0]._id);
                setSelectedFiscalYear(allYears[0]);
            }
        } catch (error) {
            console.error("Error fetching fiscal years:", error);
        }
    };

    const fetchLedgerEntries = useCallback(async (fiscalYearId: string) => {
        if (!fiscalYearId) return;

        try {
            const response = await axiosInstance.get(
                `/ledgers/party/${partyId}?fiscal_year_id=${fiscalYearId}`
            );
            const data = response.data.data;
            const entries = data.entries || [];

            setOpeningBalance(data.opening_balance || { amount: 0, type: "CR" });
            setClosingBalance(data.closing_balance || { amount: 0, type: "CR" });
            setSelectedFiscalYear(data.fiscal_year || null);

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
                type: entry.type,
                runningBalance: entry.runningBalance,
                isOpeningBalance: entry.isOpeningBalance,
            }));
            setLedgerEntries(formattedEntries);
        } catch (error) {
            setLedgerEntries([]);
            setOpeningBalance({ amount: 0, type: "CR" });
            setClosingBalance({ amount: 0, type: "CR" });
            console.error("Error fetching ledger entries:", error);
        }
    }, [partyId]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await Promise.all([fetchPartyDetails(), fetchFiscalYears()]);
            setLoading(false);
        };

        if (partyId) {
            fetchData();
        }
    }, [partyId]);

    useEffect(() => {
        if (selectedFiscalYearId) {
            fetchLedgerEntries(selectedFiscalYearId);
        }
    }, [selectedFiscalYearId, fetchLedgerEntries]);

    const handleFiscalYearChange = (fiscalYearId: string) => {
        setSelectedFiscalYearId(fiscalYearId);
        const fy = fiscalYears.find((y) => y._id === fiscalYearId) || null;
        setSelectedFiscalYear(fy);
    };

    const handleOpeningBalanceSaved = () => {
        if (selectedFiscalYearId) {
            fetchLedgerEntries(selectedFiscalYearId);
        }
    };

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

    const tableFooter = (
        <TableRow>
            <TableCell colSpan={6} className="text-right font-bold">Total</TableCell>
            <TableCell className="text-right font-bold">
                {totalDebit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </TableCell>
            <TableCell className="text-right font-bold">
                {totalCredit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </TableCell>
            <TableCell className="text-right font-bold">
                <div>Closing Balance</div>
                <div>
                    {closingBalance.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}{" "}
                    {closingBalance.type}
                </div>
            </TableCell>
        </TableRow>
    );

    const formattedDateRange = useMemo(() => {
        if (!selectedFiscalYear) return "";
        const fromStr = format(new Date(selectedFiscalYear.fromDate), "dd/MM/yyyy");
        const toStr = format(new Date(selectedFiscalYear.toDate), "dd/MM/yyyy");
        return `From ${fromStr} to ${toStr}`;
    }, [selectedFiscalYear]);

    const formatTableDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const day = format(date, "dd");
            const month = format(date, "MMM").substring(0, 3);
            const year = format(date, "yyyy");

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
        } catch {
            return dateStr;
        }
    };

    const handlePrint = () => {
        if (!selectedFiscalYear) return;
        const fromStr = format(new Date(selectedFiscalYear.fromDate), "yyyy-MM-dd");
        const toStr = format(new Date(selectedFiscalYear.toDate), "yyyy-MM-dd");
        router.push(
            `/parties/${partyId}/print?from=${fromStr}&to=${toStr}&fiscal_year_id=${selectedFiscalYearId}`
        );
    };

    if (loading) return <Loader />;
    if (!party) return <div>Party not found</div>;

    return (
        <AppLayout>
            <div className="flex flex-col gap-6">
                <h1 className="text-2xl font-bold print:hidden">Party Details</h1>

                <div className="hidden print:block party-header">
                    <h1>SAMJHANA SUPPLIERS</h1>
                    <h2>H.O.SAINAMAINA-03,MURGIYA, RUPANDEHI, BRANCH:- SHIVARAJ-05,CHANRAUTA, KAPILVASTU</h2>
                    <h2 className="text-center font-bold">LEDGER</h2>
                    <div className="date-range text-center">( {formattedDateRange} )</div>
                    <div className="text-center">Account : {party.name}</div>
                </div>

                <Card className="p-6 print:hidden">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-semibold">Party Information</h2>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                                onClick={() => setOpeningBalanceModalOpen(true)}
                            >
                                <Wallet className="h-4 w-4" />
                                Set Opening Balance
                            </Button>
                            <Link href={`/parties/${partyId}/edit`}>
                                <Button variant="outline" size="sm" className="flex items-center gap-2">
                                    <Pencil className="h-4 w-4" />
                                    Edit Party
                                </Button>
                            </Link>
                        </div>
                    </div>
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
                            <p className="mt-1">{party.email || "N/A"}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Phone</label>
                            <p className="mt-1">{party.phone}</p>
                        </div>
                        {party.altPhone && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Alternate Phone</label>
                                <p className="mt-1">{party.altPhone}</p>
                            </div>
                        )}
                        {party.contactPerson && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Contact Person</label>
                                <p className="mt-1">{party.contactPerson}</p>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-500">PAN Number</label>
                            <p className="mt-1">{party.panNumber}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Is VATable</label>
                            <p className="mt-1">{party.isVatable ? "Yes" : "No"}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Party Margin</label>
                            <p className="mt-1">{party.partyMargin}%</p>
                        </div>
                        {party.website && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Website</label>
                                <p className="mt-1">
                                    <a href={party.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                        {party.website}
                                    </a>
                                </p>
                            </div>
                        )}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-500">Address</label>
                            <p className="mt-1">{party.address}</p>
                        </div>
                    </div>
                </Card>

                <div className="mt-4 lg:mt-6">
                    <div className="flex justify-between items-center mx-4 mb-4 relative z-10 print:hidden">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="fiscalYear" className="text-sm font-medium whitespace-nowrap">
                                    Fiscal Year
                                </Label>
                                <Select
                                    value={selectedFiscalYearId}
                                    onValueChange={handleFiscalYearChange}
                                >
                                    <SelectTrigger id="fiscalYear" className="w-[180px]">
                                        <SelectValue placeholder="Select fiscal year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fiscalYears.map((fy) => (
                                            <SelectItem key={fy._id} value={fy._id}>
                                                {fy.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button
                            onClick={handlePrint}
                            className="flex items-center gap-2 print:hidden"
                            aria-label="Print ledger"
                            disabled={!selectedFiscalYear}
                        >
                            <Printer className="h-4 w-4" />
                            Print Ledger
                        </Button>
                    </div>

                    <Card className="mx-4 mb-4 p-4 print:hidden">
                        <div className="text-sm font-medium text-gray-500">Opening Balance</div>
                        <div className="text-lg font-semibold mt-1">
                            {openingBalance.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}{" "}
                            {openingBalance.type}
                        </div>
                    </Card>

                    <TransactionTable
                        title="Ledger Entries"
                        data={ledgerEntries}
                        showType={true}
                        footer={tableFooter}
                        columns={[
                            {
                                header: "Miti",
                                accessorKey: "miti",
                                headerClassName:
                                    "sticky left-0 z-20 min-w-[110px] bg-card whitespace-nowrap",
                                cellClassName:
                                    "sticky left-0 z-10 min-w-[110px] bg-card whitespace-nowrap font-medium",
                                cell: (transaction: LedgerEntry) => transaction.miti || "—",
                            },
                            {
                                header: "Date",
                                accessorKey: "date",
                                cell: (transaction: LedgerEntry) => formatTableDate(transaction.date),
                            },
                            {
                                header: "Type",
                                accessorKey: "type",
                                cell: (transaction: LedgerEntry) => transaction.type || "Sale",
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
                                cell: (transaction: LedgerEntry) => transaction.description || "",
                            },
                            {
                                header: "Debit(Rs.)",
                                accessorKey: "drAmount",
                                cell: (transaction: LedgerEntry) => {
                                    const amount = transaction.drAmount;
                                    return amount
                                        ? amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })
                                        : "";
                                },
                            },
                            {
                                header: "Credit(Rs.)",
                                accessorKey: "crAmount",
                                cell: (transaction: LedgerEntry) => {
                                    const amount = transaction.crAmount;
                                    return amount
                                        ? amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })
                                        : "";
                                },
                            },
                            {
                                header: "Balance(Rs.)",
                                accessorKey: "runningBalance",
                                cell: (transaction: LedgerEntry) => {
                                    const balance = transaction.runningBalance;
                                    if (balance === undefined) return "";

                                    const absBalance = Math.abs(balance).toLocaleString("en-IN", {
                                        maximumFractionDigits: 2,
                                    });
                                    return balance < 0 ? `${absBalance} DR` : `${absBalance} CR`;
                                },
                            },
                        ]}
                        searchableColumns={[
                            {
                                id: "date",
                                value: (row: LedgerEntry) => row.date,
                            },
                            {
                                id: "invoiceNumber",
                                value: (row: LedgerEntry) => row.invoiceNumber || "",
                            },
                        ]}
                    />

                    <div className="hidden print:block ledger-footer">
                        <div className="text-right font-bold">
                            <span>Grand Total</span>
                            <span className="ml-10">
                                {totalDebit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                            </span>
                            <span className="ml-10">
                                {totalCredit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="text-right mt-2">
                            <span className="font-bold">Closing Balance</span>
                            <span className="ml-10 font-bold">
                                {closingBalance.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}{" "}
                                {closingBalance.type}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <OpeningBalanceModal
                open={openingBalanceModalOpen}
                onClose={() => setOpeningBalanceModalOpen(false)}
                onSuccess={handleOpeningBalanceSaved}
                partyId={partyId}
                fiscalYears={fiscalYears}
                selectedFiscalYearId={selectedFiscalYearId}
            />
        </AppLayout>
    );
}
