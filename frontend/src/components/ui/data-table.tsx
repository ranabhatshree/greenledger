"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { ReactNode, useState, useMemo } from "react";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T, index: number) => ReactNode;
  id?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  loading?: boolean;
  footer?: ReactNode;
}

export const DataTable = <T,>({ 
  data, 
  columns, 
  title,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  loading,
  footer
}: DataTableProps<T>) => {
  return (
    <Card className="overflow-hidden p-4 lg:p-6 print:p-0 print:shadow-none print:border-0">
      <div className="flex flex-col gap-4">
        {title && <h2 className="text-lg font-semibold print:hidden">{title}</h2>}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center print:hidden">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-10" 
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 overflow-x-auto print:mt-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead key={index}>{column.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columns.map((column, colIndex) => (
                      <TableCell key={colIndex}>
                        {column.cell
                          ? column.cell(item, rowIndex)
                          : column.accessorKey
                          ? String(item[column.accessorKey])
                          : null}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
            {footer && (
              <TableFooter>
                {footer}
              </TableFooter>
            )}
          </Table>
        </div>
      </div>
    </Card>
  );
}; 