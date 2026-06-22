"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { cn } from "@/lib/utils";

const DATE_INPUT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

interface FormDatePickerProps {
  selected: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function FormDatePicker({
  selected,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
}: FormDatePickerProps) {
  return (
    <DatePicker
      selected={selected ?? null}
      onChange={(date) => onChange(date ?? undefined)}
      dateFormat="dd/MM/yyyy"
      placeholderText={placeholder}
      disabled={disabled}
      className={cn(DATE_INPUT_CLASS, className)}
    />
  );
}
