"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { type FiscalYear } from "@/lib/api/fiscalYears";
import {
  createOpeningBalance,
  getOpeningBalance,
  type OpeningBalance,
} from "@/lib/api/openingBalances";

interface OpeningBalanceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  partyId: string;
  fiscalYears: FiscalYear[];
  selectedFiscalYearId?: string;
}

export function OpeningBalanceModal({
  open,
  onClose,
  onSuccess,
  partyId,
  fiscalYears,
  selectedFiscalYearId,
}: OpeningBalanceModalProps) {
  const [loading, setLoading] = useState(false);
  const [fiscalYearId, setFiscalYearId] = useState(selectedFiscalYearId || "");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"CR" | "DR">("CR");
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFiscalYearId(selectedFiscalYearId || fiscalYears[0]?._id || "");
    }
  }, [open, selectedFiscalYearId, fiscalYears]);

  useEffect(() => {
    const loadExisting = async () => {
      if (!open || !fiscalYearId || !partyId) return;

      try {
        const existing: OpeningBalance = await getOpeningBalance(partyId, fiscalYearId);
        if (existing._id) {
          setExistingId(existing._id);
          setAmount(String(existing.amount));
          setType(existing.type);
        } else {
          setExistingId(null);
          setAmount("0");
          setType("CR");
        }
      } catch {
        setExistingId(null);
        setAmount("0");
        setType("CR");
      }
    };

    loadExisting();
  }, [open, fiscalYearId, partyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fiscalYearId) {
      toast.error("Please select a fiscal year");
      return;
    }

    setLoading(true);
    try {
      await createOpeningBalance({
        partyId,
        fiscalYearId,
        amount: parseFloat(amount) || 0,
        type,
      });
      toast.success(
        existingId ? "Opening balance updated successfully" : "Opening balance created successfully"
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save opening balance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Opening Balance</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fiscalYear">Fiscal Year</Label>
            <Select value={fiscalYearId} onValueChange={setFiscalYearId}>
              <SelectTrigger id="fiscalYear">
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

          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as "CR" | "DR")}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CR">CR</SelectItem>
                <SelectItem value="DR">DR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
