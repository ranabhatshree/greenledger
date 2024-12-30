import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface LedgerEntry {
  _id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

interface PartyLedgerTableProps {
  data: LedgerEntry[];
}

export const PartyLedgerTable = ({ data }: PartyLedgerTableProps) => {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "NPR",
    }).format(amount);
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Debit</TableHead>
            <TableHead className="text-right">Credit</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((entry) => (
            <TableRow key={entry._id}>
              <TableCell>{format(new Date(entry.date), "dd/MM/yyyy")}</TableCell>
              <TableCell>{entry.description}</TableCell>
              <TableCell className="text-right">
                {entry.debit > 0 ? formatAmount(entry.debit) : "-"}
              </TableCell>
              <TableCell className="text-right">
                {entry.credit > 0 ? formatAmount(entry.credit) : "-"}
              </TableCell>
              <TableCell className="text-right">{formatAmount(entry.balance)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}; 