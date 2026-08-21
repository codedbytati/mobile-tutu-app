import { router } from 'expo-router';
import { Banknote, Bell, CarFront, CreditCard, Cross, HouseHeart, ListCollapse, Utensils } from 'lucide-react-native';
import { useMemo } from 'react';
import { FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { useTransactions } from '@/contexts/TransactionContext';
import type { Transaction } from '@/types/transaction';
import { useAuth } from '@/contexts/AuthContext';

const Avatar = require('../../assets/images/avatar.png');
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const CATEGORY_ICONS = {
  Alimentação: Utensils,
  Transporte: CarFront,
  Moradia: HouseHeart,
  Saúde: Cross,
  Salário: Banknote,
  Outros: ListCollapse,
} as const;

type TransactionGroup = { key: string; date: Date; transactions: Transaction[] };

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function TransactionsScreen() {
  const { user } = useAuth();
  const { transactions, filters, setFilters, loading, loadingMore, hasMore, error, refresh, loadMore } = useTransactions();
  const visibleTransactions = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return term ? transactions.filter((item) => `${item.description} ${item.category}`.toLowerCase().includes(term)) : transactions;
  }, [filters.search, transactions]);
  const transactionGroups = useMemo(() => {
    const groups = new Map<string, TransactionGroup>();
    visibleTransactions.forEach((transaction) => {
      const date = transaction.date.toDate();
      const key = getDateKey(date);
      const group = groups.get(key);
      if (group) group.transactions.push(transaction);
      else groups.set(key, { key, date, transactions: [transaction] });
    });
    return Array.from(groups.values());
  }, [visibleTransactions]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.profileBlock}>
            <Image source={Avatar} accessibilityLabel="Avatar de usuário" style={styles.avatar} />
            <Text style={styles.greeting}>Olá, {user?.displayName || 'você'}!</Text>
          </View>
          <View style={styles.topActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Mensagens" style={styles.iconButton}>
              <CreditCard size={20} color={Colors.light.text} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Notificações" style={styles.iconButton}>
              <Bell size={20} color={Colors.light.text} />
            </Pressable>
          </View>
        </View>
        <FlatList
          data={transactionGroups}
          keyExtractor={(item) => item.key}
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
            <View style={styles.chips}>{(['all', 'income', 'expense'] as const).map((type) => <Pressable key={type} accessibilityRole="button" accessibilityState={{ selected: filters.type === type }} onPress={() => setFilters({ type })} style={[styles.chip, filters.type === type && styles.chipActive]}>
              <Text style={[styles.chipText, filters.type === type && styles.chipTextActive]}>{type === 'all' ? 'Tudo' : type === 'income' ? 'Receitas' : 'Despesas'}</Text>
            </Pressable>)}
            </View>
          </>}
          ListEmptyComponent={!loading ? <Text style={styles.empty}>Nenhuma transação encontrada.</Text> : null}
          ListFooterComponent={loadingMore || hasMore ? <Text style={styles.footer}>{loadingMore ? 'Carregando...' : 'Role para carregar mais'}</Text> : null}
          renderItem={({ item }) => <TransactionGroupView group={item} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function TransactionGroupView({ group }: { group: TransactionGroup }) {
  return <View style={styles.group}>
    <Text style={styles.groupTitle}>{dateFormatter.format(group.date)}</Text>
    {group.transactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)}
  </View>;
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const positive = transaction.type === 'income';
  const CategoryIcon = CATEGORY_ICONS[transaction.category];
  return <Pressable accessibilityRole="button" accessibilityLabel={`Editar ${transaction.description}`} onPress={() => router.push({ pathname: '/new-transaction', params: { id: transaction.id, mode: 'edit' } })} style={styles.row}><View style={[styles.categoryIcon, { backgroundColor: positive ? Colors.light.success : Colors.light.danger }]}><CategoryIcon size={20} color={Colors.light.text} /></View>
    <View style={styles.rowDetails}>
      <Text style={styles.description}>{transaction.description}</Text>
      <Text style={styles.meta}>{transaction.category}</Text>
    </View>
    <Text style={[styles.amount, { color: positive ? Colors.light.success : Colors.light.danger }]}>{positive ? '+' : '-'} {money.format(transaction.amount)}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  profileBlock: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  avatar: { width: 60, height: 60, borderRadius: 50, backgroundColor: Colors.light.backgroundSelected },
  greeting: { color: Colors.light.text, fontSize: 20, fontWeight: '500' },
  topActions: { flexDirection: 'row', gap: Spacing.two },
  iconButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: Colors.light.border, alignItems: 'center', justifyContent: 'center' },
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
  chipText: { color: Colors.light.textSecondary, fontSize: 18, fontWeight: '500' },
  chipTextActive: { color: Colors.light.text, fontSize: 18, fontWeight: '500' },
  group: { backgroundColor: Colors.light.backgroundElement, borderRadius: 20, marginTop: Spacing.three, overflow: 'hidden' },
  groupTitle: { color: Colors.light.text, fontSize: 18, fontWeight: '600', paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  row: { minHeight: 78, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.light.border, paddingHorizontal: Spacing.three },
  categoryIcon: { width: 38, height: 38, borderRadius: 19, marginRight: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  rowDetails: { flex: 1 },
  description: { color: Colors.light.text, fontSize: 18, fontWeight: '500' },
  meta: { color: Colors.light.textSecondary, fontSize: 16, fontWeight: '400', marginTop: 3 },
  amount: { fontSize: 16, fontWeight: '500' },
  empty: { color: Colors.light.textSecondary, fontSize: 18, textAlign: 'center', paddingVertical: 48 },
  footer: { color: Colors.light.textSecondary, textAlign: 'center', paddingVertical: Spacing.three },
  error: { color: Colors.light.danger, marginTop: Spacing.two },
});
