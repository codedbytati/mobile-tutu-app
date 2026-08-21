import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Banknote, CarFront, Cross, HouseHeart, ListCollapse, Utensils } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { getTransactionError, useTransactions } from '@/contexts/TransactionContext';
import { TRANSACTION_CATEGORIES, type TransactionCategory, type TransactionType } from '@/types/transaction';

const CATEGORY_ICONS = {
  Alimentação: Utensils,
  Transporte: CarFront,
  Moradia: HouseHeart,
  Saúde: Cross,
  Salário: Banknote,
  Outros: ListCollapse,
} as const;

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default function NewTransactionScreen() {
  const { id, mode } = useLocalSearchParams<{ id?: string; mode?: 'create' | 'edit' }>();
  const { transactions, addTransaction, updateTransaction } = useTransactions();
  const editing = mode === 'edit';
  const existing = editing && id ? transactions.find((item) => item.id === id) : undefined;
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [transactionDateText, setTransactionDateText] = useState(formatDateInput(new Date()));
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<TransactionCategory>('Outros');
  const [receiptUri, setReceiptUri] = useState<string>();
  const [receiptFileName, setReceiptFileName] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (existing) {
      const date = existing.date.toDate();
      setDescription(existing.description);
      setAmount(String(existing.amount).replace('.', ','));
      setTransactionDate(date);
      setTransactionDateText(formatDateInput(date));
      setType(existing.type);
      setCategory(existing.category);
      return;
    }
    const today = new Date();
    setDescription('');
    setAmount('');
    setTransactionDate(today);
    setTransactionDateText(formatDateInput(today));
    setType('expense');
    setCategory('Outros');
    setReceiptUri(undefined);
    setReceiptFileName(undefined);
    setErrors([]);
  }, [existing]);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      setTransactionDate(selectedDate);
      setTransactionDateText(formatDateInput(selectedDate));
    }
  };

  const commitWebDate = () => {
    const nextDate = parseDateInput(transactionDateText);
    if (nextDate) setTransactionDate(nextDate);
    else setTransactionDateText(formatDateInput(transactionDate));
  };

  const chooseImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Permissão necessária', 'Permita o acesso às fotos para anexar um comprovante.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
    if (!result.canceled) {
      setReceiptUri(result.assets[0].uri);
      setReceiptFileName(result.assets[0].fileName ?? 'imagem');
    }
  };

  const chooseDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'text/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (!result.canceled) {
      setReceiptUri(result.assets[0].uri);
      setReceiptFileName(result.assets[0].name);
    }
  };

  const save = async () => {
    const numericAmount = Number(amount.replace(',', '.'));
    const validationErrors = [
      description.trim().length < 3 ? 'Informe uma descrição com pelo menos 3 caracteres.' : '',
      !Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 100000000 ? 'Informe um valor entre R$ 0,01 e R$ 100.000.000,00.' : '',
      !TRANSACTION_CATEGORIES.includes(category) ? 'Escolha uma categoria válida.' : '',
    ].filter(Boolean);
    if (validationErrors.length) { setErrors(validationErrors); return; }
    setSaving(true); setErrors([]);
    try {
      const input = { description, amount: numericAmount, type, category, date: transactionDate, receiptUri, receiptFileName };
      if (existing) await updateTransaction(existing.id, input);
      else await addTransaction(input);
      router.navigate('/transactions');
    }
    catch (cause) {
      setErrors([getTransactionError(cause, existing ? 'Não foi possível atualizar a transação.' : 'Não foi possível salvar a transação.')]);
    }
    finally { setSaving(false); }
  };

  return <SafeAreaView style={styles.safeArea}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={20} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">{existing ? 'Editar transação' : 'Cadastrar transação'}</Text>
        {errors.map((error) => <Text key={error} accessibilityRole="alert" style={styles.error}>{error}</Text>)}
        <View style={styles.segment}>
          <Toggle label="Despesa" selected={type === 'expense'} onPress={() => setType('expense')} />
          <Toggle label="Receita" selected={type === 'income'} onPress={() => setType('income')} />
        </View>
        <Text style={styles.label}>Descrição</Text>
        <TextInput accessibilityLabel="Descrição da transação" value={description} onChangeText={setDescription} placeholder="Ex.: Mercado" style={styles.input} />
        <Text style={styles.label}>Valor</Text>
        <TextInput accessibilityLabel="Valor da transação" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholder="0,00" style={styles.input} />
        <Text style={styles.label}>Data da transação</Text>
        {Platform.OS === 'web' ? <TextInput accessibilityLabel="Data da transação" value={transactionDateText} onChangeText={setTransactionDateText} onBlur={commitWebDate} placeholder="AAAA-MM-DD" style={styles.input} /> : <DateTimePicker accessibilityLabel="Data da transação" value={transactionDate} mode="date" display="default" onChange={handleDateChange} />}
        <Text style={styles.label}>Categoria</Text>
        <View style={styles.categories}>{TRANSACTION_CATEGORIES.map((item) => {
          const Icon = CATEGORY_ICONS[item];
          const selected = category === item;
          return <Pressable key={item} accessibilityRole="button" accessibilityLabel={`Categoria ${item}`} accessibilityState={{ selected }} onPress={() => setCategory(item)} style={[styles.category, selected && styles.categorySelected]}>
            <Icon size={30} color={selected ? Colors.light.text : Colors.light.textSecondary} />
            <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{item}</Text>
          </Pressable>;
        })}
        </View>
        <Text style={styles.label}>Comprovante</Text>
        <Text style={styles.helper}>Opcional. O arquivo deve ter no máximo 450 KB.</Text><View style={styles.receiptRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Anexar imagem" accessibilityHint="Abre a galeria de imagens" onPress={() => void chooseImage()} style={styles.receipt}>
            <Text style={styles.receiptText}>Imagem</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Anexar documento ou PDF" accessibilityHint="Abre o seletor de documentos" onPress={() => void chooseDocument()} style={styles.receipt}>
            <Text style={styles.receiptText}>Documento/PDF</Text>
          </Pressable>
        </View>
        {receiptUri && <Text style={styles.selectedFile}>{receiptFileName ?? 'Arquivo selecionado'}</Text>}
        {receiptUri && <Image accessibilityLabel="Prévia do comprovante" source={{ uri: receiptUri }} style={styles.preview} />}
        <Pressable disabled={saving} accessibilityRole="button" accessibilityState={{ disabled: saving }} onPress={() => void save()} style={[styles.save, saving && styles.saveDisabled]}>
          <Text style={styles.saveText}>{saving ? 'Salvando...' : existing ? 'Atualizar transação' : 'Salvar transação'}</Text>
        </Pressable>
      </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

function Toggle({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.toggle, selected && styles.toggleSelected]}>
    <Text style={[styles.toggleText, selected && styles.toggleTextSelected]}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  flex: { flex: 1 },
  content: { padding: Spacing.four, paddingBottom: 48 },
  iconButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: Colors.light.border, alignItems: 'center', justifyContent: 'center' },
  backText: { color: Colors.light.text, fontWeight: '800' },
  eyebrow: { color: Colors.light.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginTop: Spacing.two },
  title: { color: Colors.light.text, fontSize: 35, fontWeight: '500', letterSpacing: -1, marginTop: Spacing.five, marginBottom: Spacing.five },
  label: { color: Colors.light.text, fontSize: 18, fontWeight: '500', marginTop: Spacing.three, marginBottom: Spacing.one },
  helper: { color: Colors.light.textSecondary, fontSize: 16, marginTop: -Spacing.one, marginBottom: Spacing.two },
  segment: { flexDirection: 'row', gap: Spacing.two },
  toggle: { flex: 1, borderWidth: 1, borderColor: Colors.light.border, backgroundColor: Colors.light.backgroundElement, borderRadius: 24, minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  toggleSelected: { backgroundColor: Colors.light.accent, borderColor: Colors.light.accent },
  toggleText: { color: Colors.light.textSecondary, fontSize: 18, fontWeight: '600' },
  toggleTextSelected: { color: Colors.light.text },
  input: { borderWidth: 1, borderColor: Colors.light.border, backgroundColor: Colors.light.backgroundElement, borderRadius: 16, minHeight: 52, paddingHorizontal: Spacing.three, color: Colors.light.text, fontSize: 16 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  category: { width: '30%', minHeight: 86, borderWidth: 2, borderColor: Colors.light.border, backgroundColor: Colors.light.backgroundElement, borderRadius: 18, paddingVertical: Spacing.two, paddingHorizontal: Spacing.one, alignItems: 'center', justifyContent: 'center', gap: Spacing.one },
  categorySelected: { backgroundColor: Colors.light.accent, borderColor: Colors.light.accent },
  categoryText: { color: Colors.light.textSecondary, fontSize: 16, textAlign: 'center' },
  categoryTextSelected: { color: Colors.light.text, fontWeight: '500' },
  receiptRow: { flexDirection: 'row', gap: Spacing.two },
  receipt: { flex: 1, borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.light.accent, backgroundColor: Colors.light.backgroundElement, borderRadius: 18, minHeight: 56, justifyContent: 'center', alignItems: 'center' },
  receiptText: { color: Colors.light.text, fontSize: 16, fontWeight: '600' },
  selectedFile: { color: Colors.light.success, fontSize: 13, fontWeight: '700', marginTop: Spacing.one },
  preview: { width: '100%', height: 180, borderRadius: 18, marginTop: Spacing.two },
  save: { backgroundColor: Colors.light.accent, minHeight: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.four },
  saveDisabled: { opacity: 0.55 },
  saveText: { color: Colors.light.text, fontSize: 18, fontWeight: '600' },
  error: { color: Colors.light.danger, marginBottom: Spacing.one },
});
