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
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { ReactNode, useState, useMemo } from "react";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T, index: number) => ReactNode;
  id?: string;
}

export interface DataTableProps<TData> {
  title?: string;
  data: TData[];
  columns: Column<TData>[];
  searchPlaceholder?: string;
  searchableColumns?: {
    id: string;
    value: (row: TData) => string;
  }[];
}

export function DataTable<T>({
  title,
  data,
  columns,
  searchPlaceholder = "Search...",
  searchableColumns
}: DataTableProps<T>) {
  const [searchValue, setSearchValue] = useState("");

  const filteredData = useMemo(() => {
    if (!searchValue || !searchableColumns) return data;
    return data.filter(row => 
      searchableColumns.some(column => 
        column.value(row).toLowerCase().includes(searchValue.toLowerCase())
      )
    );
  }, [data, searchValue, searchableColumns]);

  return (
    <Card className="overflow-hidden p-4 lg:p-6">
      <div className="flex flex-col gap-4">
        {title && <h2 className="text-lg font-semibold">{title}</h2>}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input 
              className="pl-10" 
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead key={index}>{column.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item, rowIndex) => (
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
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
} 