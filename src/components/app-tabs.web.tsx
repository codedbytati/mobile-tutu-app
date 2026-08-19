import { TabList, Tabs, TabSlot, TabTrigger, type TabListProps, type TabTriggerSlotProps } from 'expo-router/ui';
import { BarChart3, Home, UserRound, type LucideIcon } from 'lucide-react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild><IconTab icon={Home} label="Dashboard" /></TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild><IconTab icon={BarChart3} label="Transações" /></TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild><IconTab icon={UserRound} label="Profile" /></TabTrigger>
          <TabTrigger name="new-transaction" href="/new-transaction" style={styles.hiddenTab} />
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

function IconTab({ icon: Icon, label, isFocused, ...props }: TabTriggerSlotProps & { icon: LucideIcon; label: string }) {
  return <Pressable {...props} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: isFocused }} style={({ pressed }) => [styles.tab, isFocused && styles.tabSelected, pressed && styles.pressed]}><Icon size={25} strokeWidth={isFocused ? 2.5 : 2} color={isFocused ? Colors.light.text : Colors.light.textSecondary} /></Pressable>;
}

function CustomTabList(props: TabListProps) {
  return <View {...props} style={styles.tabList}><View style={styles.innerContainer}>{props.children}</View></View>;
}

const styles = StyleSheet.create({
  slot: { flex: 1, paddingBottom: 96 },
  tabList: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 96, alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: Spacing.three, paddingBottom: Spacing.three },
  innerContainer: { maxWidth: 420, width: '100%', height: 72, borderRadius: 36, backgroundColor: Colors.light.backgroundElement, borderWidth: 1, borderColor: Colors.light.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: Spacing.five, shadowColor: '#655C82', shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  tab: { width: 58, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  tabSelected: { backgroundColor: Colors.light.backgroundSelected },
  pressed: { opacity: 0.65 },
  hiddenTab: { display: 'none' },
});
