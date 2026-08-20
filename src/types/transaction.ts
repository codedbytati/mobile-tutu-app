import type { Timestamp } from "firebase/firestore";

export type TransactionType = "income" | "expense";

export const TRANSACTION_CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Saúde",
  "Salário",
  "Outros",
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export interface Transaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: Timestamp;
  receiptUrl?: string;
  receiptDataUrl?: string;
  receiptFileName?: string;
  createdAt: Timestamp;
}

export interface TransactionInput {
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: Date;
  receiptUri?: string;
  receiptFileName?: string;
}

export interface TransactionFilters {
  search: string;
  type: TransactionType | "all";
  category: TransactionCategory | "all";
  startDate?: Date;
  endDate?: Date;
}
