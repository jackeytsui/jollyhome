import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Alert,
} from 'react-native';
import {
  Home,
  Receipt,
  CheckSquare,
  Calendar,
  ShoppingCart,
  Utensils,
  Package,
  Wrench,
  BookOpen,
  Users,
  MoreHorizontal,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { useSettingsStore } from '@/stores/settings';
import { colors } from '@/constants/theme';

const MAX_TABS = 5;

interface TabOption {
  key: string;
  label: string;
  Icon: React.ComponentType<{ color: string; size: number }>;
}

const ALL_TABS: TabOption[] = [
  { key: 'home', label: 'Home', Icon: Home },
  { key: 'expenses', label: 'Expenses', Icon: Receipt },
  { key: 'chores', label: 'Chores', Icon: CheckSquare },
  { key: 'calendar', label: 'Calendar', Icon: Calendar },
  { key: 'more', label: 'More', Icon: MoreHorizontal },
  { key: 'shopping', label: 'Shopping', Icon: ShoppingCart },
  { key: 'meals', label: 'Meals', Icon: Utensils },
  { key: 'supplies', label: 'Supplies', Icon: Package },
  { key: 'maintenance', label: 'Maintenance', Icon: Wrench },
  { key: 'rules', label: 'Rules', Icon: BookOpen },
  { key: 'members', label: 'Members', Icon: Users },
];

export default function TabCustomizationScreen() {
  const { selectedTabs, setSelectedTabs } = useSettingsStore();
  const [localSelected, setLocalSelected] = useState<string[]>(selectedTabs);

  const remaining = MAX_TABS - localSelected.length;

  function handleToggle(key: string) {
    if (localSelected.includes(key)) {
      setLocalSelected((prev) => prev.filter((k) => k !== key));
    } else if (localSelected.length >= MAX_TABS) {
      Alert.alert('Tab Limit', 'Uncheck one first to add a different tab.');
    } else {
      setLocalSelected((prev) => [...prev, key]);
    }
  }

  async function handleSave() {
    if (localSelected.length !== MAX_TABS) {
      Alert.alert('Select 5 tabs', `Please select exactly ${MAX_TABS} tabs.`);
      return;
    }
    setSelectedTabs(localSelected);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.heading}>Customize Tabs</Text>
        <Text style={styles.subheading}>Choose 5 features to show in your tab bar</Text>
        {remaining > 0 && (
          <Text style={styles.hint}>Select {remaining} more</Text>
        )}
        {remaining === 0 && (
          <Text style={styles.hintDone}>5 of 5 selected</Text>
        )}
      </View>

      <FlatList
        data={ALL_TABS}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isSelected = localSelected.includes(item.key);
          return (
            <Pressable
              onPress={() => handleToggle(item.key)}
              style={[styles.row, isSelected && styles.rowSelected]}
            >
              <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                <item.Icon
                  color={isSelected ? colors.accent.light : colors.textSecondary.light}
                  size={22}
                />
              </View>
              <Text style={[styles.label, isSelected && styles.labelSelected]}>
                {item.label}
              </Text>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </Pressable>
          );
        }}
        ListFooterComponent={
          <View style={styles.footer}>
            <Button
              label="Save"
              variant="primary"
              onPress={handleSave}
              disabled={localSelected.length !== MAX_TABS}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.dominant.light,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
    gap: 4,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 26,
  },
  subheading: {
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  hint: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.light,
    lineHeight: 20,
    marginTop: 4,
  },
  hintDone: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success.light,
    lineHeight: 20,
    marginTop: 4,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.secondary.light,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 12,
  },
  rowSelected: {
    borderColor: colors.accent.light,
    backgroundColor: colors.accent.light + '0D',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.dominant.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerSelected: {
    backgroundColor: colors.accent.light + '1A',
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 24,
  },
  labelSelected: {
    color: colors.accent.light,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.accent.light,
    borderColor: colors.accent.light,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    marginTop: 16,
  },
});
