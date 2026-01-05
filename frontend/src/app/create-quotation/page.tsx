"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, X, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { numberToWords } from "@/lib/utils/numberToWords";

interface CustomColumn {
  id: string;
  name: string;
  type: "text" | "number" | "date";
}

interface QuotationItem {
  id: number;
  description: string;
  unit: string;
  quantity: number;
  pricePerUnit: number;
  customFields: Record<string, string | number>;
}

const VAT_RATE = 13; // Fixed 13% VAT

const UNIT_OPTIONS = ["Hour", "Piece", "Service", "Day", "Week", "Month", "Kg", "Litre", "Meter", "Box", "Set"];

export default function CreateQuotationPage() {
  // Header state
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [quotationNo, setQuotationNo] = useState<string>(
    `QT-${Date.now().toString().slice(-6)}`
  );

  // Shipper state
  const [shipper, setShipper] = useState({
    companyName: "",
    address: "",
    contact: "",
    cin: "",
    email: "",
    vatNo: "",
  });

  // Receiver state
  const [receiver, setReceiver] = useState({
    name: "",
    address: "",
    cell: "",
    email: "",
    vatNo: "",
  });

  // Note
  const [note, setNote] = useState("Material cost 100% advance. Product warranty 1 year");

  // Items state
  const [items, setItems] = useState<QuotationItem[]>([
    {
      id: 1,
      description: "",
      unit: "Piece",
      quantity: 1,
      pricePerUnit: 0,
      customFields: {},
    },
  ]);

  // Custom columns state
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);

  // Summary state
  const [discount, setDiscount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // Declaration
  const [declaration, setDeclaration] = useState("");

  // Dialog state for adding columns
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState<"text" | "number" | "date">("text");

  // Router for navigation
  const router = useRouter();

  // Calculate amount for a single item (with VAT)
  const calculateItemAmount = (item: QuotationItem): number => {
    const baseAmount = item.quantity * item.pricePerUnit;
    const vatAmount = (baseAmount * VAT_RATE) / 100;
    return baseAmount + vatAmount;
  };

  // Calculate subtotal (sum of base amounts without VAT)
  const calculateSubTotal = (): number => {
    return items.reduce((sum, item) => {
      const baseAmount = item.quantity * item.pricePerUnit;
      return sum + baseAmount;
    }, 0);
  };

  // Calculate discount amount
  const calculateDiscountAmount = (): number => {
    const subtotal = calculateSubTotal();
    return (subtotal * discount) / 100;
  };

  // Calculate VAT amount
  const calculateVATAmount = (): number => {
    const subtotal = calculateSubTotal();
    const discountAmount = calculateDiscountAmount();
    const taxableAmount = subtotal - discountAmount;
    return (taxableAmount * VAT_RATE) / 100;
  };

  // Calculate final amount (subtotal - discount + VAT on discounted amount)
  const calculateFinalAmount = (): number => {
    const subtotal = calculateSubTotal();
    const discountAmount = calculateDiscountAmount();
    const taxableAmount = subtotal - discountAmount;
    const vatAmount = calculateVATAmount();
    return taxableAmount + vatAmount;
  };

  // Calculate balance
  const calculateBalance = (): number => {
    return calculateFinalAmount() - amountPaid;
  };

  // Add new item
  const handleAddItem = () => {
    const newItem: QuotationItem = {
      id: items.length + 1,
      description: "",
      unit: "Piece",
      quantity: 1,
      pricePerUnit: 0,
      customFields: {},
    };
    // Initialize custom fields for new item
    customColumns.forEach((col) => {
      newItem.customFields[col.id] = col.type === "number" ? 0 : "";
    });
    setItems([...items, newItem]);
  };

  // Remove item
  const handleRemoveItem = (id: number) => {
    if (items.length <= 1) return;
    const filtered = items.filter((item) => item.id !== id);
    // Reorder IDs
    const reordered = filtered.map((item, index) => ({
      ...item,
      id: index + 1,
    }));
    setItems(reordered);
  };

  // Update item field
  const updateItem = (
    id: number,
    field: keyof QuotationItem | "customField",
    value: string | number,
    customFieldId?: string
  ) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          if (field === "customField" && customFieldId) {
            return {
              ...item,
              customFields: {
                ...item.customFields,
                [customFieldId]: value,
              },
            };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Add custom column
  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;

    const newColumn: CustomColumn = {
      id: `col-${Date.now()}`,
      name: newColumnName.trim(),
      type: newColumnType,
    };

    setCustomColumns([...customColumns, newColumn]);

    // Add this column to all existing items
    setItems(
      items.map((item) => ({
        ...item,
        customFields: {
          ...item.customFields,
          [newColumn.id]: newColumnType === "number" ? 0 : "",
        },
      }))
    );

    // Reset dialog
    setNewColumnName("");
    setNewColumnType("text");
    setIsAddColumnDialogOpen(false);
  };

  // Remove custom column
  const handleRemoveColumn = (columnId: string) => {
    setCustomColumns(customColumns.filter((col) => col.id !== columnId));
    // Remove from all items
    setItems(
      items.map((item) => {
        const { [columnId]: removed, ...rest } = item.customFields;
        return { ...item, customFields: rest };
      })
    );
  };

  // Preview Quotation
  const handlePreviewQuotation = () => {
    // Save quotation data to sessionStorage
    const quotationData = {
      date,
      quotationNo,
      shipper,
      receiver,
      note,
      items,
      customColumns,
      discount,
      amountPaid,
      declaration,
    };

    sessionStorage.setItem("quotationPreviewData", JSON.stringify(quotationData));
    router.push("/create-quotation/preview");
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Create Quotation</h1>
          <Button
            onClick={handlePreviewQuotation}
            className="bg-green-600 hover:bg-green-700"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview Quotation
          </Button>
        </div>

        <Card className="p-6">
          {/* Quotation Form */}
          <div className="bg-white p-8 space-y-6">
            {/* Header Section */}
            <div className="flex justify-between items-start border-b-2 border-green-600 pb-4">
              <h1 className="text-3xl font-bold text-green-600">Quotation</h1>
              <div className="text-right space-y-2">
                <div className="flex items-center gap-4">
                  <Label className="font-semibold">Date:</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="font-semibold">Quotation No.:</Label>
                  <Input
                    value={quotationNo}
                    onChange={(e) => setQuotationNo(e.target.value)}
                    className="w-auto"
                  />
                </div>
              </div>
            </div>

            {/* Party Information */}
            <div className="grid grid-cols-2 gap-8">
              {/* Shipper */}
              <div className="space-y-3 border-r pr-8">
                <h2 className="text-lg font-semibold text-green-600 border-b pb-2">
                  Shipper
                </h2>
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm">Company Name</Label>
                    <Input
                      value={shipper.companyName}
                      onChange={(e) =>
                        setShipper({ ...shipper, companyName: e.target.value })
                      }
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Address</Label>
                    <Textarea
                      value={shipper.address}
                      onChange={(e) =>
                        setShipper({ ...shipper, address: e.target.value })
                      }
                      placeholder="Enter address"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Contact</Label>
                    <Input
                      value={shipper.contact}
                      onChange={(e) =>
                        setShipper({ ...shipper, contact: e.target.value })
                      }
                      placeholder="Enter contact"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">CIN</Label>
                    <Input
                      value={shipper.cin}
                      onChange={(e) =>
                        setShipper({ ...shipper, cin: e.target.value })
                      }
                      placeholder="Enter CIN"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Email</Label>
                    <Input
                      type="email"
                      value={shipper.email}
                      onChange={(e) =>
                        setShipper({ ...shipper, email: e.target.value })
                      }
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">VAT No.</Label>
                    <Input
                      value={shipper.vatNo}
                      onChange={(e) =>
                        setShipper({ ...shipper, vatNo: e.target.value })
                      }
                      placeholder="Enter VAT No."
                    />
                  </div>
                </div>
              </div>

              {/* Receiver */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-green-600 border-b pb-2">
                  Receiver
                </h2>
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm">Name</Label>
                    <Input
                      value={receiver.name}
                      onChange={(e) =>
                        setReceiver({ ...receiver, name: e.target.value })
                      }
                      placeholder="Enter name"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Address</Label>
                    <Textarea
                      value={receiver.address}
                      onChange={(e) =>
                        setReceiver({ ...receiver, address: e.target.value })
                      }
                      placeholder="Enter address"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Cell</Label>
                    <Input
                      value={receiver.cell}
                      onChange={(e) =>
                        setReceiver({ ...receiver, cell: e.target.value })
                      }
                      placeholder="Enter cell"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Email</Label>
                    <Input
                      type="email"
                      value={receiver.email}
                      onChange={(e) =>
                        setReceiver({ ...receiver, email: e.target.value })
                      }
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">VAT No.</Label>
                    <Input
                      value={receiver.vatNo}
                      onChange={(e) =>
                        setReceiver({ ...receiver, vatNo: e.target.value })
                      }
                      placeholder="Enter VAT No."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Note / Remark */}
            <div>
              <Label className="text-sm font-semibold">Note / Remark</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Material cost 100% advance. Product warranty 1 year"
                rows={2}
              />
            </div>

            {/* Quotation Items Table */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-green-600">
                  Quotation Items
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddColumnDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Column
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Row
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-green-50">
                      <th className="border p-2 text-left font-semibold">S.No</th>
                      <th className="border p-2 text-left font-semibold">
                        Description
                      </th>
                      <th className="border p-2 text-left font-semibold">Unit</th>
                      <th className="border p-2 text-left font-semibold">
                        Quantity
                      </th>
                      <th className="border p-2 text-left font-semibold">
                        Price / Unit
                      </th>
                      <th className="border p-2 text-left font-semibold">
                        VAT (13%)
                      </th>
                      {customColumns.map((col) => (
                        <th key={col.id} className="border p-2 text-left font-semibold relative">
                          {col.name}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-0 right-0 h-6 w-6 p-0"
                            onClick={() => handleRemoveColumn(col.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </th>
                      ))}
                      <th className="border p-2 text-left font-semibold">Amount</th>
                      <th className="border p-2 text-left font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="border p-2">{item.id}</td>
                        <td className="border p-2">
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              updateItem(item.id, "description", e.target.value)
                            }
                            placeholder="Enter description"
                            className="border-0 p-0 h-auto"
                          />
                        </td>
                        <td className="border p-2">
                          <Select
                            value={item.unit}
                            onValueChange={(value) =>
                              updateItem(item.id, "unit", value)
                            }
                          >
                            <SelectTrigger className="border-0 p-0 h-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {UNIT_OPTIONS.map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border p-2">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="border-0 p-0 h-auto"
                            min="0"
                          />
                        </td>
                        <td className="border p-2">
                          <Input
                            type="number"
                            value={item.pricePerUnit}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "pricePerUnit",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="border-0 p-0 h-auto"
                            min="0"
                          />
                        </td>
                        <td className="border p-2 text-center">13%</td>
                        {customColumns.map((col) => (
                          <td key={col.id} className="border p-2">
                            {col.type === "date" ? (
                              <Input
                                type="date"
                                value={
                                  (item.customFields[col.id] as string) || ""
                                }
                                onChange={(e) =>
                                  updateItem(
                                    item.id,
                                    "customField",
                                    e.target.value,
                                    col.id
                                  )
                                }
                                className="border-0 p-0 h-auto"
                              />
                            ) : (
                              <Input
                                type={col.type}
                                value={item.customFields[col.id] || ""}
                                onChange={(e) =>
                                  updateItem(
                                    item.id,
                                    "customField",
                                    col.type === "number"
                                      ? parseFloat(e.target.value) || 0
                                      : e.target.value,
                                    col.id
                                  )
                                }
                                className="border-0 p-0 h-auto"
                                min={col.type === "number" ? "0" : undefined}
                              />
                            )}
                          </td>
                        ))}
                        <td className="border p-2 font-semibold">
                          Rs. {calculateItemAmount(item).toFixed(2)}
                        </td>
                        <td className="border p-2">
                          {items.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Section */}
            <div className="flex justify-end">
              <div className="w-80 space-y-2 border p-4 rounded-lg bg-gray-50">
                <div className="flex justify-between">
                  <span>Sub Total:</span>
                  <span className="font-semibold">
                    Rs. {calculateSubTotal().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Discount:</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) =>
                        setDiscount(parseFloat(e.target.value) || 0)
                      }
                      className="w-20 h-8"
                      min="0"
                      max="100"
                    />
                    <span>%</span>
                    <span className="font-semibold w-24 text-right">
                      Rs. {calculateDiscountAmount().toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>VAT (13%):</span>
                  <span className="font-semibold">
                    Rs. {calculateVATAmount().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Final Amount:</span>
                  <span className="font-semibold text-lg">
                    Rs. {calculateFinalAmount().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Amount Paid:</span>
                  <Input
                    type="number"
                    value={amountPaid}
                    onChange={(e) =>
                      setAmountPaid(parseFloat(e.target.value) || 0)
                    }
                    className="w-32 h-8"
                    min="0"
                  />
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Balance:</span>
                  <span className="font-semibold text-lg">
                    Rs. {calculateBalance().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Amount in Words */}
            <div className="border-t pt-4">
              <p className="text-sm">
                <span className="font-semibold">Amount in Words: </span>
                <span className="italic">
                  {numberToWords(calculateFinalAmount())}
                </span>
              </p>
            </div>

            {/* Declaration */}
            <div>
              <Label className="text-sm font-semibold">Declaration</Label>
              <Textarea
                value={declaration}
                onChange={(e) => setDeclaration(e.target.value)}
                placeholder="Enter declaration (optional)"
                rows={2}
              />
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-8">
              <div className="border-t pt-4">
                <p className="font-semibold">Client&apos;s Signature</p>
              </div>
              <div className="border-t pt-4">
                <p className="font-semibold">Business Signature</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Add Column Dialog */}
        <Dialog open={isAddColumnDialogOpen} onOpenChange={setIsAddColumnDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Column</DialogTitle>
              <DialogDescription>
                Add a new column to the quotation items table.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Column Name</Label>
                <Input
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="e.g., Expiry Date, MRP, Batch No"
                />
              </div>
              <div>
                <Label>Column Type</Label>
                <Select
                  value={newColumnType}
                  onValueChange={(value: "text" | "number" | "date") =>
                    setNewColumnType(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddColumnDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddColumn}>Add Column</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

