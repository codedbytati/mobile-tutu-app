import { Link, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { useTransactions } from '@/contexts/TransactionContext';
import { TRANSACTION_CATEGORIES, type Transaction } from '@/types/transaction';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function parseDate(value: string, endOfDay = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00'}`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default function TransactionsScreen() {
  const { transactions, filters, setFilters, loading, loadingMore, hasMore, error, refresh, loadMore } = useTransactions();
  const [startDateText, setStartDateText] = useState(filters.startDate?.toISOString().slice(0, 10) ?? '');
  const [endDateText, setEndDateText] = useState(filters.endDate?.toISOString().slice(0, 10) ?? '');
  const visibleTransactions = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return term ? transactions.filter((item) => `${item.description} ${item.category}`.toLowerCase().includes(term)) : transactions;
  }, [filters.search, transactions]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={visibleTransactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refresh()} />}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={<>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title} accessibilityRole="header">Transações</Text>
            </View>
          </View>
          <TextInput accessibilityLabel="Buscar transações" accessibilityHint="Digite uma descrição ou categoria" value={filters.search} onChangeText={(search) => setFilters({ search })} placeholder="Buscar por descrição" placeholderTextColor={Colors.light.textSecondary} style={styles.search} />
          <View style={styles.dateRow}><TextInput accessibilityLabel="Data inicial" placeholder="Data inicial (AAAA-MM-DD)" value={startDateText} onChangeText={setStartDateText} onEndEditing={() => setFilters({ startDate: parseDate(startDateText) })} placeholderTextColor={Colors.light.textSecondary} style={styles.dateInput} /><TextInput accessibilityLabel="Data final" placeholder="Data final (AAAA-MM-DD)" value={endDateText} onChangeText={setEndDateText} onEndEditing={() => setFilters({ endDate: parseDate(endDateText, true) })} placeholderTextColor={Colors.light.textSecondary} style={styles.dateInput} /></View>
          <View style={styles.chips}>{(['all', 'income', 'expense'] as const).map((type) => <Pressable key={type} accessibilityRole="button" accessibilityState={{ selected: filters.type === type }} onPress={() => setFilters({ type })} style={[styles.chip, filters.type === type && styles.chipActive]}><Text style={[styles.chipText, filters.type === type && styles.chipTextActive]}>{type === 'all' ? 'Tudo' : type === 'income' ? 'Receitas' : 'Despesas'}</Text></Pressable>)}</View>
          <FlatList horizontal data={['all', ...TRANSACTION_CATEGORIES]} keyExtractor={(item) => item} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList} renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityState={{ selected: filters.category === item }} onPress={() => setFilters({ category: item as typeof filters.category })} style={[styles.categoryChip, filters.category === item && styles.categoryActive]}><Text style={styles.categoryText}>{item === 'all' ? 'Categorias' : item}</Text></Pressable>} />
          {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        </>}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Nenhuma transação encontrada.</Text> : null}
        ListFooterComponent={loadingMore || hasMore ? <Text style={styles.footer}>{loadingMore ? 'Carregando...' : 'Role para carregar mais'}</Text> : null}
        renderItem={({ item }) => <TransactionRow transaction={item} />}
      />
    </SafeAreaView>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const positive = transaction.type === 'income';
  return <Pressable accessibilityRole="button" accessibilityLabel={`Editar ${transaction.description}`} onPress={() => router.push({ pathname: '/new-transaction', params: { id: transaction.id } })} style={styles.row}><View style={[styles.dot, { backgroundColor: positive ? Colors.light.success : Colors.light.danger }]} /><View style={styles.rowDetails}><Text style={styles.description}>{transaction.description}</Text><Text style={styles.meta}>{transaction.category}</Text></View><Text style={[styles.amount, { color: positive ? Colors.light.success : Colors.light.danger }]}>{positive ? '+' : '-'} {money.format(transaction.amount)}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: Spacing.four, paddingBottom: 48 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: Colors.light.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  title: { color: Colors.light.text, fontSize: 35, fontWeight: '500', marginTop: Spacing.five, letterSpacing: -1 },
  addButton: { backgroundColor: Colors.light.accent, width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  addText: { color: Colors.light.text, fontSize: 30, fontWeight: '300', lineHeight: 34 },
  search: { borderWidth: 1, borderColor: Colors.light.border, backgroundColor: Colors.light.backgroundElement, borderRadius: 22, padding: Spacing.three, color: Colors.light.text, marginTop: Spacing.four, fontSize: 16, minHeight: 56 },
  dateRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  dateInput: { flex: 1, borderWidth: 1, borderColor: Colors.light.border, backgroundColor: Colors.light.backgroundElement, borderRadius: 16, minHeight: 48, paddingHorizontal: Spacing.two, color: Colors.light.text, fontSize: 12 },
  chips: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three },
  chip: { borderRadius: 22, borderWidth: 1, borderColor: Colors.light.border, paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, minHeight: 44, justifyContent: 'center', backgroundColor: Colors.light.backgroundElement }, chipActive: { backgroundColor: Colors.light.accent, borderColor: Colors.light.accent },
  chipText: { color: Colors.light.textSecondary, fontWeight: '700' },
  chipTextActive: { color: Colors.light.text },
  categoryList: { gap: Spacing.two, paddingVertical: Spacing.three },
  categoryChip: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.two, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  categoryActive: { borderBottomColor: Colors.light.accent },
  categoryText: { color: Colors.light.textSecondary, fontSize: 13 },
  row: { minHeight: 78, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: Spacing.three },
  rowDetails: { flex: 1 },
  description: { color: Colors.light.text, fontSize: 16, fontWeight: '700' },
  meta: { color: Colors.light.textSecondary, fontSize: 13, marginTop: 3 },
  amount: { fontSize: 14, fontWeight: '800' },
  empty: { color: Colors.light.textSecondary, textAlign: 'center', paddingVertical: 48 },
  footer: { color: Colors.light.textSecondary, textAlign: 'center', paddingVertical: Spacing.three },
  error: { color: Colors.light.danger, marginTop: Spacing.two },
});
