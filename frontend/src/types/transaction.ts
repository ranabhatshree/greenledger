export interface Transaction {
  id: number; // or string, depending on your data structure
  type: string;
  description: string;
  date: string;
  amount: string;
  status: string;
} 