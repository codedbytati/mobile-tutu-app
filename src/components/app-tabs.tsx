import { TabList, Tabs, TabSlot, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { BarChart3, Home, UserRound, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <View style={styles.tabList}>
          <TabTrigger name="index" href="/" asChild>
            <IconTab icon={Home} label="Dashboard" />
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <IconTab icon={BarChart3} label="Transações" />
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <IconTab icon={UserRound} label="Profile" />
          </TabTrigger>
          <TabTrigger name="new-transaction" href="/new-transaction" style={styles.hiddenTab} />
        </View>
      </TabList>
    </Tabs>
  );
}

function IconTab({ icon: Icon, label, isFocused, ...props }: TabTriggerSlotProps & { icon: LucideIcon; label: string }) {
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [styles.tab, isFocused && styles.tabSelected, pressed && styles.pressed]}>
      <Icon size={25} strokeWidth={isFocused ? 2.5 : 2} color={isFocused ? Colors.light.text : Colors.light.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1, paddingBottom: 92 },
  tabList: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 82, backgroundColor: Colors.light.backgroundElement, borderTopWidth: 1, borderTopColor: Colors.light.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: Spacing.five, paddingBottom: Spacing.two },
  tab: { width: 58, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  tabSelected: { backgroundColor: Colors.light.backgroundSelected },
  pressed: { opacity: 0.65 },
  hiddenTab: { display: 'none' },
});
