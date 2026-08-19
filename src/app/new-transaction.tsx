import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { useTransactions } from '@/contexts/TransactionContext';
import { TRANSACTION_CATEGORIES, type TransactionCategory, type TransactionType } from '@/types/transaction';

export default function NewTransactionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { transactions, addTransaction, updateTransaction } = useTransactions();
  const existing = id ? transactions.find((item) => item.id === id) : undefined;
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<TransactionCategory>('Outros');
  const [receiptUri, setReceiptUri] = useState<string>();
  const [receiptFileName, setReceiptFileName] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!existing) return;
    setDescription(existing.description);
    setAmount(String(existing.amount).replace('.', ','));
    setType(existing.type);
    setCategory(existing.category);
  }, [existing]);

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
      const input = { description, amount: numericAmount, type, category, date: existing?.date.toDate() ?? new Date(), receiptUri, receiptFileName };
      if (existing) await updateTransaction(existing.id, input);
      else await addTransaction(input);
      router.navigate('/explore');
    }
    catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      setErrors([message || 'Não foi possível salvar a transação no Firestore.']);
    }
    finally { setSaving(false); }
  };

  return <SafeAreaView style={styles.safeArea}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹ Voltar</Text></Pressable>
    <Text style={styles.eyebrow}>{existing ? 'EDITAR MOVIMENTAÇÃO' : 'NOVA MOVIMENTAÇÃO'}</Text><Text style={styles.title} accessibilityRole="header">{existing ? 'Editar transação' : 'Cadastrar transação'}</Text>
    {errors.map((error) => <Text key={error} accessibilityRole="alert" style={styles.error}>{error}</Text>)}
    <Text style={styles.label}>Tipo</Text><View style={styles.segment}><Toggle label="Despesa" selected={type === 'expense'} onPress={() => setType('expense')} /><Toggle label="Receita" selected={type === 'income'} onPress={() => setType('income')} /></View>
    <Text style={styles.label}>Descrição</Text><TextInput accessibilityLabel="Descrição da transação" value={description} onChangeText={setDescription} placeholder="Ex.: Mercado" style={styles.input} />
    <Text style={styles.label}>Valor</Text><TextInput accessibilityLabel="Valor da transação" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholder="0,00" style={styles.input} />
    <Text style={styles.label}>Categoria</Text><View style={styles.categories}>{TRANSACTION_CATEGORIES.map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: category === item }} onPress={() => setCategory(item)} style={[styles.category, category === item && styles.categorySelected]}><Text style={[styles.categoryText, category === item && styles.categoryTextSelected]}>{item}</Text></Pressable>)}</View>
    <Text style={styles.label}>Comprovante</Text><Text style={styles.helper}>Opcional. O arquivo deve ter no máximo 450 KB.</Text><View style={styles.receiptRow}><Pressable accessibilityRole="button" accessibilityLabel="Anexar imagem" accessibilityHint="Abre a galeria de imagens" onPress={() => void chooseImage()} style={styles.receipt}><Text style={styles.receiptText}>Imagem</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Anexar documento ou PDF" accessibilityHint="Abre o seletor de documentos" onPress={() => void chooseDocument()} style={styles.receipt}><Text style={styles.receiptText}>Documento/PDF</Text></Pressable></View>{receiptUri && <Text style={styles.selectedFile}>{receiptFileName ?? 'Arquivo selecionado'}</Text>}{receiptUri && <Image accessibilityLabel="Prévia do comprovante" source={{ uri: receiptUri }} style={styles.preview} />}
    <Pressable disabled={saving} accessibilityRole="button" accessibilityState={{ disabled: saving }} onPress={() => void save()} style={[styles.save, saving && styles.saveDisabled]}><Text style={styles.saveText}>{saving ? 'Salvando...' : existing ? 'Atualizar transação' : 'Salvar transação'}</Text></Pressable>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

function Toggle({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) { return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.toggle, selected && styles.toggleSelected]}><Text style={[styles.toggleText, selected && styles.toggleTextSelected]}>{label}</Text></Pressable>; }
const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: Colors.light.background }, flex: { flex: 1 }, content: { padding: Spacing.four, paddingBottom: 48 }, back: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start' }, backText: { color: Colors.light.text, fontWeight: '800' }, eyebrow: { color: Colors.light.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginTop: Spacing.two }, title: { color: Colors.light.text, fontSize: 38, fontWeight: '800', letterSpacing: -1, marginTop: Spacing.five, marginBottom: Spacing.four }, label: { color: Colors.light.text, fontWeight: '800', marginTop: Spacing.three, marginBottom: Spacing.one }, helper: { color: Colors.light.textSecondary, fontSize: 12, marginTop: -Spacing.one, marginBottom: Spacing.two }, segment: { flexDirection: 'row', gap: Spacing.two }, toggle: { flex: 1, borderWidth: 1, borderColor: Colors.light.border, backgroundColor: Colors.light.backgroundElement, borderRadius: 24, minHeight: 48, justifyContent: 'center', alignItems: 'center' }, toggleSelected: { backgroundColor: Colors.light.accent, borderColor: Colors.light.accent }, toggleText: { color: Colors.light.textSecondary, fontWeight: '700' }, toggleTextSelected: { color: Colors.light.text }, input: { borderWidth: 1, borderColor: Colors.light.border, backgroundColor: Colors.light.backgroundElement, borderRadius: 16, minHeight: 52, paddingHorizontal: Spacing.three, color: Colors.light.text, fontSize: 16 }, categories: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }, category: { borderWidth: 1, borderColor: Colors.light.border, backgroundColor: Colors.light.backgroundElement, borderRadius: 18, paddingVertical: Spacing.two, paddingHorizontal: Spacing.two }, categorySelected: { backgroundColor: Colors.light.accent, borderColor: Colors.light.accent }, categoryText: { color: Colors.light.textSecondary, fontSize: 13 }, categoryTextSelected: { color: Colors.light.text, fontWeight: '700' }, receiptRow: { flexDirection: 'row', gap: Spacing.two }, receipt: { flex: 1, borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.light.accent, backgroundColor: Colors.light.backgroundElement, borderRadius: 18, minHeight: 56, justifyContent: 'center', alignItems: 'center' }, receiptText: { color: Colors.light.text, fontWeight: '800' }, selectedFile: { color: Colors.light.success, fontSize: 13, fontWeight: '700', marginTop: Spacing.one }, preview: { width: '100%', height: 180, borderRadius: 18, marginTop: Spacing.two }, save: { backgroundColor: Colors.light.accent, minHeight: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.four }, saveDisabled: { opacity: 0.55 }, saveText: { color: Colors.light.text, fontSize: 16, fontWeight: '800' }, error: { color: Colors.light.danger, marginBottom: Spacing.one },
});
