import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registering, setRegistering] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const validationError = registering && username.trim().length < 2
      ? 'Informe um nome de usuário com pelo menos 2 caracteres.'
      : !email.trim() || password.length < 6
        ? 'Informe um e-mail e uma senha com pelo menos 6 caracteres.'
        : null;
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError(null);
    try {
      if (registering) await signUp(username, email, password);
      else await signIn(email, password);
    } catch (cause) {
      const code = cause && typeof cause === 'object' && 'code' in cause ? String(cause.code) : '';
      const message = cause instanceof Error ? cause.message : String(cause);
      if (code.includes('configuration-not-found') || message.includes('CONFIGURATION_NOT_FOUND')) {
        setError('Ative o provedor E-mail/senha no Firebase Console.');
      } else {
        setError(registering ? 'Não foi possível criar a conta.' : 'E-mail ou senha inválidos.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => setRegistering(false)} style={styles.backButton}>
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>
            <Text style={styles.title} accessibilityRole="header">{registering ? 'Cadastre-se' : 'Entre na sua conta'}</Text>
          </View>

          <View style={styles.formCard}>
            {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
            {registering && <Field label="Nome de usuário" accessibilityLabel="Nome de usuário" value={username} onChangeText={setUsername} placeholder="Como devemos chamar você?" autoCapitalize="words" />}
            <Field label="E-mail" accessibilityLabel="E-mail" value={email} onChangeText={setEmail} placeholder="seuemail@exemplo.com" keyboardType="email-address" autoCapitalize="none" />
            <Field label="Senha" accessibilityLabel="Senha" value={password} onChangeText={setPassword} placeholder="Mínimo de 6 caracteres" secureTextEntry />
            <Pressable disabled={loading} accessibilityRole="button" accessibilityState={{ disabled: loading }} onPress={() => void submit()} style={[styles.primaryButton, loading && styles.disabledButton]}>
              <Text style={styles.primaryText}>{loading ? 'Aguarde...' : registering ? 'Criar conta' : 'Entrar'}</Text>
            </Pressable>
            <Text style={styles.terms}>Ao continuar, você concorda com os Termos de Serviço e a Política de Privacidade.</Text>
            <Pressable accessibilityRole="button" onPress={() => { setRegistering((current) => !current); setError(null); }} style={styles.switchButton}>
              <Text style={styles.switchText}>{registering ? 'Já tenho uma conta' : 'Criar uma conta'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} style={styles.input} /></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: Spacing.four, paddingBottom: Spacing.five },
  header: { paddingTop: Spacing.two },
  backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: Colors.light.border, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: Colors.light.text, fontSize: 30, lineHeight: 32, fontWeight: '300' },
  title: { color: Colors.light.text, fontSize: 35, fontWeight: '500', letterSpacing: -1, marginTop: Spacing.five },
  subtitle: { color: Colors.light.text, fontSize: 16, fontWeight: '600', marginTop: Spacing.four },
  formCard: { backgroundColor: Colors.light.backgroundElement, borderRadius: 28, padding: Spacing.three, marginTop: Spacing.five, borderWidth: 1, borderColor: Colors.light.border },
  field: { marginBottom: Spacing.three },
  label: { color: Colors.light.text, fontSize: 14, fontWeight: '700', marginBottom: Spacing.one },
  input: { minHeight: 54, borderRadius: 18, borderWidth: 1, borderColor: Colors.light.border, paddingHorizontal: Spacing.three, color: Colors.light.text, fontSize: 15 },
  primaryButton: { minHeight: 56, borderRadius: 28, backgroundColor: Colors.light.accent, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.one },
  disabledButton: { opacity: 0.6 },
  primaryText: { color: Colors.light.text, fontWeight: '500', fontSize: 14 },
  terms: { color: Colors.light.textSecondary, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: Spacing.four },
  switchButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  switchText: { color: Colors.light.text, fontWeight: '700' },
  error: { color: Colors.light.danger, fontSize: 13, fontWeight: '700', marginBottom: Spacing.two },
});
