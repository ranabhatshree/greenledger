import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number, currency: string = 'NPR ') => {
  return `${currency}${amount.toLocaleString('en-US')}`;
};

export const getBusinessName = () => {
  return process.env.NEXT_PUBLIC_BUSINESS_NAME || "Green Ledger";
};

export const getBusinessLogo = () => {
  return process.env.NEXT_PUBLIC_BUSINESS_LOGO || null;
};

export const getThemeColor = () => {
  return process.env.NEXT_PUBLIC_THEME_COLOR || "#1e40af";
};
