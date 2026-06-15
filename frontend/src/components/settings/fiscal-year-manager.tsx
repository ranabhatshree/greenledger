"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  getFiscalYears,
  createFiscalYear,
  updateFiscalYear,
  deleteFiscalYear,
  type FiscalYear,
} from "@/lib/api/fiscalYears";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FiscalYearFormData {
  title: string;
  shortDescription: string;
  fromDate: string;
  toDate: string;
  isActive: boolean;
}

const emptyForm: FiscalYearFormData = {
  title: "",
  shortDescription: "",
  fromDate: "",
  toDate: "",
  isActive: false,
};

export function FiscalYearManager() {
  const { toast } = useToast();
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FiscalYearFormData>(emptyForm);

  const fetchFiscalYears = async () => {
    try {
      setLoading(true);
      const data = await getFiscalYears();
      setFiscalYears(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to load fiscal years",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiscalYears();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (fy: FiscalYear) => {
    setEditingId(fy._id);
    setFormData({
      title: fy.title,
      shortDescription: fy.shortDescription || "",
      fromDate: fy.fromDate.split("T")[0],
      toDate: fy.toDate.split("T")[0],
      isActive: fy.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateFiscalYear(editingId, formData);
        toast({ title: "Success", description: "Fiscal year updated successfully" });
      } else {
        await createFiscalYear(formData);
        toast({ title: "Success", description: "Fiscal year created successfully" });
      }
      setModalOpen(false);
      fetchFiscalYears();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to save fiscal year",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this fiscal year?")) return;

    try {
      await deleteFiscalYear(id);
      toast({ title: "Success", description: "Fiscal year deleted successfully" });
      fetchFiscalYears();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to delete fiscal year",
      });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Fiscal Years</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage fiscal years for ledger reporting. Only one can be active at a time.
          </p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Fiscal Year
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading fiscal years...</p>
      ) : fiscalYears.length === 0 ? (
        <p className="text-sm text-muted-foreground">No fiscal years configured yet.</p>
      ) : (
        <div className="space-y-3">
          {fiscalYears.map((fy) => (
            <div
              key={fy._id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{fy.title}</span>
                  {fy.isActive && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(fy.fromDate)} — {formatDate(fy.toDate)}
                </p>
                {fy.shortDescription && (
                  <p className="text-sm text-muted-foreground">{fy.shortDescription}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditModal(fy)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(fy._id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Fiscal Year" : "Add Fiscal Year"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="FY 82/83"
                required
              />
            </div>
            <div>
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input
                id="shortDescription"
                value={formData.shortDescription}
                onChange={(e) =>
                  setFormData({ ...formData, shortDescription: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromDate">From Date</Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={formData.fromDate}
                  onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="toDate">To Date</Label>
                <Input
                  id="toDate"
                  type="date"
                  value={formData.toDate}
                  onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isActive">Set as active fiscal year</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
