"use client";

import { useState, useEffect, Suspense } from "react";
import { format } from "date-fns";
import { Loader } from "@/components/ui/loader";
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

interface QuotationData {
  date: string;
  quotationNo: string;
  shipper: {
    companyName: string;
    address: string;
    contact: string;
    cin: string;
    email: string;
    vatNo: string;
  };
  receiver: {
    name: string;
    address: string;
    cell: string;
    email: string;
    vatNo: string;
  };
  note: string;
  items: QuotationItem[];
  customColumns: CustomColumn[];
  discount: number;
  amountPaid: number;
  declaration: string;
}

const VAT_RATE = 13;

function QuotationPreviewContent() {
  const [quotationData, setQuotationData] = useState<QuotationData | null>(null);

  useEffect(() => {
    // Get quotation data from sessionStorage
    const storedData = sessionStorage.getItem("quotationPreviewData");
    if (storedData) {
      try {
        setQuotationData(JSON.parse(storedData));
      } catch (error) {
        console.error("Error parsing quotation data:", error);
      }
    }
  }, []);

  useEffect(() => {
    // Auto-print when component loads
    if (quotationData) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [quotationData]);

  if (!quotationData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Loading quotation...</p>
        </div>
      </div>
    );
  }

  // Calculate amount for a single item (with VAT)
  const calculateItemAmount = (item: QuotationItem): number => {
    const baseAmount = item.quantity * item.pricePerUnit;
    const vatAmount = (baseAmount * VAT_RATE) / 100;
    return baseAmount + vatAmount;
  };

  // Calculate subtotal
  const calculateSubTotal = (): number => {
    return quotationData.items.reduce((sum, item) => {
      const baseAmount = item.quantity * item.pricePerUnit;
      return sum + baseAmount;
    }, 0);
  };

  // Calculate discount amount
  const calculateDiscountAmount = (): number => {
    const subtotal = calculateSubTotal();
    return (subtotal * quotationData.discount) / 100;
  };

  // Calculate VAT amount
  const calculateVATAmount = (): number => {
    const subtotal = calculateSubTotal();
    const discountAmount = calculateDiscountAmount();
    const taxableAmount = subtotal - discountAmount;
    return (taxableAmount * VAT_RATE) / 100;
  };

  // Calculate final amount
  const calculateFinalAmount = (): number => {
    const subtotal = calculateSubTotal();
    const discountAmount = calculateDiscountAmount();
    const taxableAmount = subtotal - discountAmount;
    const vatAmount = calculateVATAmount();
    return taxableAmount + vatAmount;
  };

  // Calculate balance
  const calculateBalance = (): number => {
    return calculateFinalAmount() - quotationData.amountPaid;
  };

  const formatCurrency = (amount: number): string => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4;
            margin: 5mm !important;
          }
          
          * {
            box-sizing: border-box !important;
          }
          
          body {
            font-size: 7pt !important;
            line-height: 1.2 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Compact quotation container */
          .quotation-container {
            padding: 3mm !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          
          /* Reduce spacing - very aggressive */
          .quotation-container > * {
            margin-bottom: 2mm !important;
          }
          
          /* Compact header */
          .quotation-header {
            margin-bottom: 2mm !important;
          }
          
          .quotation-header h1 {
            font-size: 18pt !important;
            margin-bottom: 1mm !important;
            line-height: 1.1 !important;
            padding: 0 !important;
          }
          
          .quotation-header > div {
            margin-bottom: 1mm !important;
          }
          
          /* Compact party info */
          .party-info-section {
            margin-bottom: 2mm !important;
          }
          
          .party-section {
            margin-bottom: 0 !important;
            padding: 1mm !important;
          }
          
          .party-section h2 {
            font-size: 8pt !important;
            padding: 1mm 2mm !important;
            margin-bottom: 0 !important;
            line-height: 1.2 !important;
          }
          
          .party-section > div {
            padding: 1mm !important;
            font-size: 7pt !important;
            line-height: 1.2 !important;
          }
          
          .party-section p {
            margin-bottom: 0.5mm !important;
            font-size: 7pt !important;
            line-height: 1.2 !important;
          }
          
          /* Compact table - very tight */
          .quotation-table {
            font-size: 7pt !important;
            margin-bottom: 2mm !important;
            page-break-inside: avoid !important;
            width: 100% !important;
            table-layout: fixed !important;
          }
          
          .quotation-table th {
            padding: 1mm 0.5mm !important;
            font-size: 7pt !important;
            font-weight: bold !important;
            line-height: 1.1 !important;
            white-space: nowrap !important;
          }
          
          .quotation-table td {
            padding: 1mm 0.5mm !important;
            font-size: 7pt !important;
            line-height: 1.2 !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            hyphens: auto !important;
          }
          
          /* Make description column wider but compact */
          .quotation-table th:nth-child(2),
          .quotation-table td:nth-child(2) {
            width: 35% !important;
            max-width: 35% !important;
          }
          
          /* Other columns smaller */
          .quotation-table th:not(:nth-child(2)),
          .quotation-table td:not(:nth-child(2)) {
            width: auto !important;
          }
          
          .quotation-table tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
            height: auto !important;
          }
          
          /* Compact summary */
          .summary-section {
            margin-bottom: 2mm !important;
            font-size: 7pt !important;
          }
          
          .summary-section > div {
            padding: 0.5mm 0 !important;
            margin-bottom: 0.5mm !important;
            line-height: 1.2 !important;
          }
          
          .summary-section span {
            font-size: 7pt !important;
          }
          
          /* Compact amount in words */
          .amount-words {
            font-size: 7pt !important;
            line-height: 1.2 !important;
            padding: 1mm !important;
            margin-bottom: 2mm !important;
          }
          
          .amount-words p {
            font-size: 7pt !important;
            margin-bottom: 0 !important;
            line-height: 1.2 !important;
          }
          
          /* Compact note */
          .note-section {
            margin-bottom: 2mm !important;
            padding: 1mm !important;
            font-size: 7pt !important;
          }
          
          .note-section p {
            font-size: 7pt !important;
            margin-bottom: 0 !important;
            line-height: 1.2 !important;
          }
          
          /* Compact declaration */
          .declaration-section {
            margin-bottom: 2mm !important;
            padding: 1mm !important;
            font-size: 7pt !important;
          }
          
          .declaration-section p {
            font-size: 7pt !important;
            margin-bottom: 0 !important;
            line-height: 1.2 !important;
          }
          
          /* Compact signatures */
          .signature-section {
            margin-top: 3mm !important;
            margin-bottom: 2mm !important;
            padding-top: 2mm !important;
            font-size: 7pt !important;
          }
          
          .signature-section > div {
            padding-top: 1mm !important;
          }
          
          .signature-section p {
            font-size: 7pt !important;
            margin-bottom: 0 !important;
          }
          
          /* Compact footer */
          .quotation-footer {
            margin-top: 2mm !important;
            padding-top: 1mm !important;
            font-size: 7pt !important;
          }
          
          .quotation-footer p {
            font-size: 7pt !important;
            margin-bottom: 0 !important;
          }
          
          /* Reduce gaps in grid */
          .grid {
            gap: 2mm !important;
          }
          
          /* Remove all borders radius in print */
          * {
            border-radius: 0 !important;
          }
          
          /* Ensure no page breaks in critical sections */
          .quotation-header,
          .party-info-section,
          .note-section {
            page-break-inside: avoid !important;
          }
          
          /* Remove shadows and backgrounds that waste space */
          .bg-gray-50,
          .bg-white {
            background: white !important;
          }
          
          .bg-green-100 {
            background: #dcfce7 !important;
          }
          
          /* Override all Tailwind spacing classes in print */
          .mb-8, .mb-4, .mb-2 {
            margin-bottom: 2mm !important;
          }
          
          .mt-12, .mt-8, .mt-4 {
            margin-top: 2mm !important;
          }
          
          .pt-8, .pt-4, .pt-2 {
            padding-top: 1mm !important;
          }
          
          .pb-4, .pb-2 {
            padding-bottom: 1mm !important;
          }
          
          .p-8, .p-4 {
            padding: 1mm !important;
          }
          
          .px-4, .px-3 {
            padding-left: 1mm !important;
            padding-right: 1mm !important;
          }
          
          .py-3, .py-2 {
            padding-top: 0.5mm !important;
            padding-bottom: 0.5mm !important;
          }
          
          .gap-8, .gap-4 {
            gap: 2mm !important;
          }
          
          .space-y-3 > * + *,
          .space-y-2 > * + * {
            margin-top: 0.5mm !important;
          }
          
          .min-h-[60px] {
            min-height: auto !important;
          }
          
          /* Make borders thinner */
          .border-2 {
            border-width: 1px !important;
          }
          
          /* Remove rounded corners */
          .rounded-lg, .rounded {
            border-radius: 0 !important;
          }
        }
      `}} />
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white print:bg-white">
        {/* Quotation Content */}
        <div className="quotation-container max-w-5xl mx-auto bg-white p-8 print:p-0 shadow-lg print:shadow-none my-8 print:my-0">
        {/* Header Section */}
        <div className="quotation-header mb-8">
          <div className="flex justify-between items-start">
            <h1 className="text-4xl font-bold text-gray-900 flex-1 print:tracking-wider print:letter-spacing-[0.1em]">QUOTATION</h1>
            <div className="text-right space-y-2 ml-8 flex-shrink-0">
              <div>
                <span className="font-semibold text-gray-700">DATE: </span>
                <span className="text-gray-900 border-b border-gray-400 inline-block min-w-[120px]">
                  {format(new Date(quotationData.date), "dd/MM/yyyy")}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Quotation No.: </span>
                <span className="text-gray-900 border-b border-gray-400 inline-block min-w-[120px]">
                  {quotationData.quotationNo}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Party Information */}
        <div className="party-info-section grid grid-cols-2 gap-8 mb-8">
          {/* Shipper */}
          <div className="party-section space-y-3 border-r-2 border-gray-200 pr-8">
            <div className="bg-green-100 px-4 py-2 rounded-t-lg">
              <h2 className="text-lg font-bold text-green-800 uppercase">SHIPPER</h2>
            </div>
            <div className="space-y-2 text-sm border border-t-0 border-gray-200 rounded-b-lg p-4 bg-white">
              {quotationData.shipper.companyName && (
                <p className="font-semibold text-gray-900">{quotationData.shipper.companyName}</p>
              )}
              {quotationData.shipper.address && (
                <p className="text-gray-700 whitespace-pre-line">{quotationData.shipper.address}</p>
              )}
              {quotationData.shipper.contact && (
                <p className="text-gray-700">Contact: {quotationData.shipper.contact}</p>
              )}
              {quotationData.shipper.cin && (
                <p className="text-gray-700">CIN: {quotationData.shipper.cin}</p>
              )}
              {quotationData.shipper.email && (
                <p className="text-gray-700">Email: {quotationData.shipper.email}</p>
              )}
              {quotationData.shipper.vatNo && (
                <p className="text-gray-700">VAT No.: {quotationData.shipper.vatNo}</p>
              )}
            </div>
          </div>

          {/* Receiver */}
          <div className="party-section space-y-3">
            <div className="bg-green-100 px-4 py-2 rounded-t-lg">
              <h2 className="text-lg font-bold text-green-800 uppercase">RECEIVER</h2>
            </div>
            <div className="space-y-2 text-sm border border-t-0 border-gray-200 rounded-b-lg p-4 bg-white">
              {quotationData.receiver.name && (
                <p className="font-semibold text-gray-900">{quotationData.receiver.name}</p>
              )}
              {quotationData.receiver.address && (
                <p className="text-gray-700 whitespace-pre-line">{quotationData.receiver.address}</p>
              )}
              {quotationData.receiver.cell && (
                <p className="text-gray-700">Cell: {quotationData.receiver.cell}</p>
              )}
              {quotationData.receiver.email && (
                <p className="text-gray-700">Email: {quotationData.receiver.email}</p>
              )}
              {quotationData.receiver.vatNo && (
                <p className="text-gray-700">VAT No.: {quotationData.receiver.vatNo}</p>
              )}
            </div>
          </div>
        </div>

        {/* Note / Remark */}
        {quotationData.note && (
          <div className="note-section mb-8">
            <p className="font-semibold text-gray-700 mb-2">NOTE / REMARK :</p>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p className="text-gray-700">{quotationData.note}</p>
            </div>
          </div>
        )}

        {/* Quotation Items Table */}
        <div className="mb-8">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="quotation-table w-full border-collapse">
              <thead>
                <tr className="bg-green-100">
                  <th className="border border-gray-300 p-3 text-left font-bold text-green-800">S.No.</th>
                  <th className="border border-gray-300 p-3 text-left font-bold text-green-800">Description</th>
                  <th className="border border-gray-300 p-3 text-left font-bold text-green-800">Unit</th>
                  <th className="border border-gray-300 p-3 text-left font-bold text-green-800">Quantity</th>
                  <th className="border border-gray-300 p-3 text-left font-bold text-green-800">Price/unit</th>
                  <th className="border border-gray-300 p-3 text-left font-bold text-green-800">VAT (%)</th>
                  {quotationData.customColumns.map((col) => (
                    <th key={col.id} className="border border-gray-300 p-3 text-left font-bold text-green-800">
                      {col.name}
                    </th>
                  ))}
                  <th className="border border-gray-300 p-3 text-left font-bold text-green-800">Amount</th>
                </tr>
              </thead>
              <tbody>
                {quotationData.items.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-300 p-3 text-gray-900">{item.id}</td>
                    <td className="border border-gray-300 p-3 text-gray-900">{item.description || "-"}</td>
                    <td className="border border-gray-300 p-3 text-gray-900">{item.unit}</td>
                    <td className="border border-gray-300 p-3 text-gray-900">{item.quantity}</td>
                    <td className="border border-gray-300 p-3 text-gray-900">{formatCurrency(item.pricePerUnit)}</td>
                    <td className="border border-gray-300 p-3 text-center text-gray-900">{VAT_RATE}%</td>
                    {quotationData.customColumns.map((col) => (
                      <td key={col.id} className="border border-gray-300 p-3 text-gray-900">
                        {col.type === "date" && item.customFields[col.id]
                          ? format(new Date(item.customFields[col.id] as string), "dd/MM/yyyy")
                          : item.customFields[col.id] || "-"}
                      </td>
                    ))}
                    <td className="border border-gray-300 p-3 font-semibold text-gray-900">
                      {formatCurrency(calculateItemAmount(item))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary and Amount in Words */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Amount in Words */}
          <div>
            <p className="font-semibold text-gray-700 mb-2">Amount in Words:</p>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[60px]">
              <p className="text-gray-700 italic">
                {numberToWords(calculateFinalAmount())}
              </p>
            </div>
          </div>

          {/* Summary Section */}
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-700">Sub Total:</span>
              <span className="font-semibold text-gray-900">{formatCurrency(calculateSubTotal())}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-700">Discount:</span>
              <span className="font-semibold text-gray-900">{formatCurrency(calculateDiscountAmount())}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-700">VAT (13%):</span>
              <span className="font-semibold text-gray-900">{formatCurrency(calculateVATAmount())}</span>
            </div>
            <div className="flex justify-between py-3 border-b-2 border-gray-300 bg-green-50 px-3 rounded">
              <span className="font-bold text-lg text-gray-900">Final Amount:</span>
              <span className="font-bold text-lg text-gray-900">{formatCurrency(calculateFinalAmount())}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-700">Amount Paid:</span>
              <span className="font-semibold text-gray-900">{formatCurrency(quotationData.amountPaid)}</span>
            </div>
            <div className="flex justify-between py-2 border-t-2 border-gray-300 pt-3">
              <span className="font-bold text-gray-900">Balance:</span>
              <span className="font-bold text-gray-900">{formatCurrency(calculateBalance())}</span>
            </div>
          </div>
        </div>

        {/* Declaration */}
        {quotationData.declaration && (
          <div className="declaration-section mb-8">
            <p className="font-semibold text-gray-700 mb-2">Declaration:</p>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p className="text-gray-700">{quotationData.declaration}</p>
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="signature-section grid grid-cols-2 gap-8 mt-12 mb-8">
          <div className="border-t-2 border-gray-300 pt-4">
            <p className="font-semibold text-gray-900 text-center">Client&apos;s Signature</p>
          </div>
          <div className="border-t-2 border-gray-300 pt-4">
            <p className="font-semibold text-gray-900 text-center">Business Signature</p>
          </div>
        </div>

        {/* Footer */}
        <div className="quotation-footer text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-600 italic">
            Thanks for business with us!!! Please visit us again !!!
          </p>
        </div>
      </div>
      </div>
    </>
  );
}

export default function QuotationPreviewPage() {
  return (
    <Suspense fallback={<Loader />}>
      <QuotationPreviewContent />
    </Suspense>
  );
}

