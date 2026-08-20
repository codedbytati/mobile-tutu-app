import { router } from 'expo-router';
import { Bell, CreditCard, Plus, Send } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/contexts/TransactionContext';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const Avatar = require('../../assets/images/avatar.png');

function getLastSixMonths() {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    return { date, label: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') };
  });
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { transactions } = useTransactions();
  const animation = useRef(new Animated.Value(0)).current;
  const income = transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expenses = transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const balance = income - expenses;
  const months = getLastSixMonths();
  const monthlyIncome = months.map(({ date }) => transactions.filter((item) => { const transactionDate = item.date.toDate(); return item.type === 'income' && transactionDate.getFullYear() === date.getFullYear() && transactionDate.getMonth() === date.getMonth(); }).reduce((sum, item) => sum + item.amount, 0));
  const monthlyExpenses = months.map(({ date }) => transactions.filter((item) => { const transactionDate = item.date.toDate(); return item.type === 'expense' && transactionDate.getFullYear() === date.getFullYear() && transactionDate.getMonth() === date.getMonth(); }).reduce((sum, item) => sum + item.amount, 0));
  const chartMaximum = Math.max(...monthlyIncome, ...monthlyExpenses, 1);
  const incomeData = monthlyIncome.map((value, index) => ({ value, label: months[index].label }));
  const expenseData = monthlyExpenses.map((value, index) => ({ value, label: months[index].label }));

  useEffect(() => {
    Animated.timing(animation, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, [animation]);

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

        <View style={styles.balanceHeader}>
          <View>
            <Text style={styles.pageTitle} accessibilityRole="header">Saldo da conta</Text>
            <Text style={styles.balanceValue}>{money.format(balance)}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <ActionButton icon={Plus} label="Adicionar transação" onPress={() => router.push('/new-transaction')} highlighted />
        </View>

        <View style={styles.healthHeader}><View><Text style={styles.sectionTitle}>Balanço mensal</Text></View></View>
        <View style={styles.chart} accessibilityRole="image" accessibilityLabel={`Gráfico de linhas mensais de receitas e despesas dos últimos seis meses. Receitas totais ${money.format(income)} e despesas totais ${money.format(expenses)}`}>
          <LineChart data={incomeData} data2={expenseData} height={165} maxValue={chartMaximum} noOfSections={4} spacing={48} initialSpacing={12} endSpacing={12} color={Colors.light.success} color2={Colors.light.danger} thickness={3} thickness2={3} curved isAnimated animationDuration={700} hideDataPoints={false} dataPointsColor={Colors.light.success} dataPointsColor2={Colors.light.danger} rulesColor={Colors.light.border} rulesThickness={1} yAxisTextStyle={styles.chartAxisText} xAxisLabelTextStyle={styles.chartAxisText} yAxisLabelWidth={42} yAxisColor="transparent" xAxisColor="transparent" hideRules={false} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({ icon: Icon, label, onPress, highlighted = false }: { icon: typeof Send; label: string; onPress: () => void; highlighted?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.actionButton, highlighted && styles.actionButtonHighlighted]}><Icon size={17} color={Colors.light.text} /><Text style={styles.actionText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: Spacing.four, paddingBottom: 120 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  profileBlock: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  avatar: { width: 60, height: 60, borderRadius: 50, backgroundColor: Colors.light.backgroundSelected },
  greeting: { color: Colors.light.text, fontSize: 20, fontWeight: '500' },
  topActions: { flexDirection: 'row', gap: Spacing.two },
  iconButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: Colors.light.border, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.four },
  activeTab: { color: Colors.light.text, fontSize: 12, fontWeight: '800' },
  inactiveTab: { color: Colors.light.textSecondary, fontSize: 12 },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: Spacing.five },
  pageTitle: { color: Colors.light.text, fontSize: 35, fontWeight: '500', letterSpacing: -1 },
  balanceValue: { color: Colors.light.text, fontSize: 25, fontWeight: '500', marginTop: Spacing.one },
  currency: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, marginTop: Spacing.two },
  flag: { fontSize: 28 },
  growth: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.light.success, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, marginTop: Spacing.two },
  growthText: { color: Colors.light.text, fontSize: 12, fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.five, marginBottom: Spacing.five },
  actionButton: { flex: 1, minHeight: 50, borderRadius: 25, backgroundColor: Colors.light.backgroundElement, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.one, borderWidth: 1, borderColor: Colors.light.border },
  actionButtonHighlighted: { backgroundColor: Colors.light.accent, borderColor: Colors.light.accent },
  actionText: { color: Colors.light.text, fontSize: 16, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.six },
  sectionTitle: { color: Colors.light.text, fontSize: 18, fontWeight: '500' },
  sectionHint: { color: Colors.light.textSecondary, fontSize: 12 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 4, marginLeft: 5 },
  legendText: { color: Colors.light.textSecondary, fontSize: 9 },
  transferList: { gap: Spacing.two, alignItems: 'center', paddingVertical: Spacing.three },
  addTransfer: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.light.backgroundSelected, alignItems: 'center', justifyContent: 'center' },
  contactAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.light.backgroundSelected },
  healthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.three },
  arrowButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: Colors.light.border, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-25deg' }] },
  chart: { flexDirection: 'row', backgroundColor: Colors.light.backgroundElement, borderRadius: 22, borderBottomWidth: 1, borderColor: Colors.light.border, paddingTop: Spacing.three, paddingRight: Spacing.two, marginTop: Spacing.two, minHeight: 190 },
  yAxis: { width: 36, justifyContent: 'space-between', paddingBottom: 24 },
  yAxisText: { color: Colors.light.textSecondary, fontSize: 10 },
  chartAxisText: { color: Colors.light.textSecondary, fontSize: 10 },
  logout: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 5, padding: Spacing.three },
  logoutText: { color: Colors.light.textSecondary, fontSize: 12 },
});
