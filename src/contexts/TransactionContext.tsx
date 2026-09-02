import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
    Timestamp,
    updateDoc,
    where,
    type DocumentData,
    type QueryConstraint,
    type QueryDocumentSnapshot
} from 'firebase/firestore';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/services/firebase/firebaseConfig';
import type { Transaction, TransactionFilters, TransactionInput } from '@/types/transaction';

const PAGE_SIZE = 15;
const MAX_RECEIPT_BYTES = 450 * 1024;
const OPERATION_TIMEOUT_MS = 20000;
const defaultFilters: TransactionFilters = { search: '', type: 'all', category: 'all' };

interface TransactionContextValue {
  transactions: Transaction[];
  dashboardTransactions: Transaction[];
  filters: TransactionFilters;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  setFilters(filters: Partial<TransactionFilters>): void;
  refresh(): Promise<void>;
  loadMore(): Promise<void>;
  addTransaction(input: TransactionInput): Promise<void>;
  updateTransaction(id: string, input: TransactionInput): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
}

const TransactionContext = createContext<TransactionContextValue | undefined>(undefined);

function toTransaction(snapshot: QueryDocumentSnapshot<DocumentData>): Transaction {
  return { id: snapshot.id, ...(snapshot.data() as Omit<Transaction, 'id'>) };
}

function sortTransactions(items: Transaction[]) {
  return [...items].sort((first, second) => second.date.toMillis() - first.date.toMillis());
}

async function uriToDataUrl(uri: string) {
  const response = await fetch(uri);
  const blob = await response.blob();
  if (blob.size > MAX_RECEIPT_BYTES) {
    throw new Error('O comprovante deve ter no máximo 450 KB.');
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    const timeout = setTimeout(() => {
      reader.abort();
      reject(new Error('A leitura do comprovante demorou demais. Tente um arquivo menor.'));
    }, OPERATION_TIMEOUT_MS);
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Não foi possível ler o comprovante.'));
    };
    reader.onloadend = () => clearTimeout(timeout);
    reader.readAsDataURL(blob);
  });
  return dataUrl;
}

function withTimeout<T>(promise: Promise<T>, message: string) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), OPERATION_TIMEOUT_MS)),
  ]);
}

export function getTransactionError(cause: unknown, fallback: string) {
  if (cause instanceof Error && cause.message.startsWith('O comprovante')) return cause.message;
  if (cause instanceof Error && cause.message.startsWith('A leitura')) return cause.message;
  if (cause instanceof Error && cause.message.startsWith('Não foi possível ler')) return cause.message;
  if (cause instanceof Error && cause.message.startsWith('O Firestore demorou')) return cause.message;
  if (cause && typeof cause === 'object' && 'code' in cause) {
    switch (cause.code) {
      case 'permission-denied':
        return 'Você não tem permissão para realizar esta operação.';
      case 'failed-precondition':
        return 'Não foi possível concluir a operação agora. Tente novamente.';
      case 'unavailable':
      case 'deadline-exceeded':
        return 'O serviço está temporariamente indisponível. Verifique sua conexão e tente novamente.';
      default:
        return fallback;
    }
  }
  return fallback;
}

export function TransactionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dashboardTransactions, setDashboardTransactions] = useState<Transaction[]>([]);
  const [filters, setFiltersState] = useState(defaultFilters);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData>>();
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (reset: boolean, pageCursor?: QueryDocumentSnapshot<DocumentData>) => {
    if (!user) {
      setTransactions([]);
      setDashboardTransactions([]);
      setCursor(undefined);
      setHasMore(false);
      return;
    }

    reset ? setLoading(true) : setLoadingMore(true);
    setError(null);
    try {
      const constraints: QueryConstraint[] = [where('userId', '==', user.uid)];
      if (filters.search.trim()) {
        const searchTerm = filters.search.trim().toLowerCase();
        constraints.push(
          where('searchDescription', '>=', searchTerm),
          where('searchDescription', '<=', `${searchTerm}\uf8ff`),
          orderBy('searchDescription'),
        );
      }
      constraints.push(limit(PAGE_SIZE));
      if (!reset && pageCursor) constraints.splice(constraints.length - 1, 0, startAfter(pageCursor));

      const snapshot = await getDocs(query(collection(db, 'transactions'), ...constraints));
      const page = snapshot.docs.map(toTransaction);
      setTransactions((current) => sortTransactions(reset ? page : [...current, ...page]));
      setCursor(snapshot.docs.at(-1));
      setHasMore(page.length === PAGE_SIZE);
    } catch (cause) {
      setError(getTransactionError(cause, 'Não foi possível carregar as transações.'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters.search, user]);

  const fetchDashboardTransactions = useCallback(async () => {
    if (!user) {
      setDashboardTransactions([]);
      return;
    }
    try {
      const snapshot = await getDocs(query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid),
      ));
      setDashboardTransactions(sortTransactions(snapshot.docs.map(toTransaction)));
    } catch (cause) {
      setError(getTransactionError(cause, 'Não foi possível carregar o histórico de transações.'));
    }
  }, [user]);

  useEffect(() => {
    void fetchPage(true);
  }, [fetchPage]);

  useEffect(() => {
    void fetchDashboardTransactions();
  }, [fetchDashboardTransactions]);

  const setFilters = (next: Partial<TransactionFilters>) => {
    setCursor(undefined);
    setFiltersState((current) => ({ ...current, ...next }));
  };

  const refresh = () => {
    setCursor(undefined);
    return fetchPage(true);
  };

  const loadMore = () => hasMore && !loadingMore ? fetchPage(false, cursor) : Promise.resolve();

  const addTransaction = async (input: TransactionInput) => {
    if (!user) throw new Error('É necessário estar autenticado.');
    let receiptDataUrl: string | undefined;
    if (input.receiptUri) {
      receiptDataUrl = await uriToDataUrl(input.receiptUri);
    }
    const date = Timestamp.fromDate(input.date);
    const createdAt = Timestamp.now();
    const transactionData = {
      userId: user.uid,
      description: input.description.trim(),
      searchDescription: input.description.trim().toLowerCase(),
      amount: input.amount,
      type: input.type,
      category: input.category,
      date,
      createdAt,
      ...(receiptDataUrl ? { receiptDataUrl, receiptFileName: input.receiptFileName ?? 'comprovante' } : {}),
    };
    const created = await withTimeout(addDoc(collection(db, 'transactions'), transactionData), 'Não foi possível salvar a transação. Verifique sua conexão e tente novamente.');
    const savedTransaction: Transaction = { id: created.id, ...transactionData };
    setTransactions((current) => [savedTransaction, ...current.filter((item) => item.id !== savedTransaction.id)]);
    setDashboardTransactions((current) => [savedTransaction, ...current.filter((item) => item.id !== savedTransaction.id)]);
  };

  const updateTransaction = async (id: string, input: TransactionInput) => {
    if (!user) throw new Error('É necessário estar autenticado.');
    const updates: Record<string, unknown> = {
      description: input.description.trim(),
      searchDescription: input.description.trim().toLowerCase(),
      amount: input.amount,
      type: input.type,
      category: input.category,
      date: Timestamp.fromDate(input.date),
    };
    if (input.receiptUri) {
      updates.receiptDataUrl = await uriToDataUrl(input.receiptUri);
      updates.receiptFileName = input.receiptFileName ?? 'comprovante';
    }
    await withTimeout(updateDoc(doc(db, 'transactions', id), updates), 'Não foi possível atualizar a transação. Verifique sua conexão e tente novamente.');
    setTransactions((current) => current.map((item) => item.id === id ? { ...item, ...updates } as Transaction : item));
    setDashboardTransactions((current) => current.map((item) => item.id === id ? { ...item, ...updates } as Transaction : item));
  };

  const deleteTransaction = async (id: string) => {
    if (!user) throw new Error('É necessário estar autenticado.');
    await withTimeout(deleteDoc(doc(db, 'transactions', id)), 'Não foi possível excluir a transação. Verifique sua conexão e tente novamente.');
    setTransactions((current) => current.filter((item) => item.id !== id));
    setDashboardTransactions((current) => current.filter((item) => item.id !== id));
  };

  return <TransactionContext.Provider value={{ transactions, dashboardTransactions, filters, loading, loadingMore, hasMore, error, setFilters, refresh, loadMore, addTransaction, updateTransaction, deleteTransaction }}>{children}</TransactionContext.Provider>;
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) throw new Error('useTransactions deve ser usado dentro de TransactionProvider');
  return context;
}
