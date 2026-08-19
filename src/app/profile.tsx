import { ChevronRight, LogOut, Mail, ShieldCheck, UserRound } from 'lucide-react-native';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

const avatarUri = 'https://i.pravatar.cc/180?img=47';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>TUTU APP</Text>
        <Text style={styles.title} accessibilityRole="header">Profile</Text>

        <View style={styles.profileCard}>
          <Image source={{ uri: avatarUri }} accessibilityLabel="Avatar do perfil" style={styles.avatar} />
          <Text style={styles.name}>{user?.displayName || 'Pessoa usuária'}</Text>
          <Text style={styles.email}>{user?.email || 'E-mail não informado'}</Text>
        </View>

        <View style={styles.menu}>
          <ProfileRow icon={UserRound} label="Nome de usuário" value={user?.displayName || 'Não informado'} />
          <ProfileRow icon={Mail} label="E-mail" value={user?.email || 'Não informado'} />
          <ProfileRow icon={ShieldCheck} label="Conta segura" value="Firebase Authentication" />
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Sair da conta" onPress={() => void signOut()} style={styles.logoutButton}>
          <LogOut size={20} color={Colors.light.danger} />
          <Text style={styles.logoutText}>Sair da conta</Text>
          <ChevronRight size={18} color={Colors.light.danger} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileRow({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
  return <View style={styles.row}><View style={styles.rowIcon}><Icon size={19} color={Colors.light.textSecondary} /></View><View style={styles.rowCopy}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View><ChevronRight size={18} color={Colors.light.textSecondary} /></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: Spacing.four, paddingBottom: 120 },
  eyebrow: { color: Colors.light.text, fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: Colors.light.text, fontSize: 38, fontWeight: '800', letterSpacing: -1, marginTop: Spacing.five },
  profileCard: { alignItems: 'center', backgroundColor: Colors.light.backgroundElement, borderWidth: 1, borderColor: Colors.light.border, borderRadius: 28, padding: Spacing.four, marginTop: Spacing.four },
  avatar: { width: 104, height: 104, borderRadius: 52, backgroundColor: Colors.light.backgroundSelected },
  name: { color: Colors.light.text, fontSize: 22, fontWeight: '800', marginTop: Spacing.three },
  email: { color: Colors.light.textSecondary, fontSize: 14, marginTop: Spacing.one },
  menu: { backgroundColor: Colors.light.backgroundElement, borderWidth: 1, borderColor: Colors.light.border, borderRadius: 24, paddingHorizontal: Spacing.three, marginTop: Spacing.three },
  row: { minHeight: 76, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  rowIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.light.background, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, marginLeft: Spacing.two },
  rowLabel: { color: Colors.light.textSecondary, fontSize: 12 },
  rowValue: { color: Colors.light.text, fontSize: 14, fontWeight: '700', marginTop: 3 },
  logoutButton: { minHeight: 58, borderRadius: 20, borderWidth: 1, borderColor: '#FFD6D2', backgroundColor: '#FFF8F7', flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three, marginTop: Spacing.four },
  logoutText: { color: Colors.light.danger, flex: 1, fontWeight: '800', marginLeft: Spacing.two },
});
