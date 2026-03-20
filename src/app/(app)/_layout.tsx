import { Tabs } from 'expo-router';
import {
  Home,
  Receipt,
  CheckSquare,
  Calendar,
  MoreHorizontal,
  ShoppingCart,
  Utensils,
  Package,
  Wrench,
  BookOpen,
  Users,
} from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings';
import { colors } from '@/constants/theme';

const DEFAULT_TABS = ['home', 'expenses', 'chores', 'calendar', 'more'];

interface TabConfig {
  label: string;
  Icon: React.ComponentType<{ color: string; size: number }>;
  screenName: string;
}

const TAB_REGISTRY: Record<string, TabConfig> = {
  home: { label: 'Home', Icon: Home, screenName: '(home)' },
  expenses: { label: 'Expenses', Icon: Receipt, screenName: 'finances' },
  chores: { label: 'Chores', Icon: CheckSquare, screenName: 'chores' },
  calendar: { label: 'Calendar', Icon: Calendar, screenName: 'calendar' },
  more: { label: 'More', Icon: MoreHorizontal, screenName: 'more' },
  shopping: { label: 'Shopping', Icon: ShoppingCart, screenName: 'shopping' },
  meals: { label: 'Meals', Icon: Utensils, screenName: 'meals' },
  supplies: { label: 'Supplies', Icon: Package, screenName: 'supplies' },
  maintenance: { label: 'Maintenance', Icon: Wrench, screenName: 'maintenance' },
  rules: { label: 'Rules', Icon: BookOpen, screenName: 'rules' },
  members: { label: 'Members', Icon: Users, screenName: '(home)' },
};

// All possible screen names that exist as tabs
const ALL_SCREEN_NAMES = [
  '(home)',
  'finances',
  'chores',
  'calendar',
  'more',
  'shopping',
  'meals',
  'supplies',
  'maintenance',
  'rules',
  'create-household',
];

export default function AppLayout() {
  const { t } = useTranslation();
  const { selectedTabs } = useSettingsStore();

  const activeTabs = (selectedTabs.length > 0 ? selectedTabs : DEFAULT_TABS)
    .filter((key) => key in TAB_REGISTRY);

  // Build set of visible screen names (some tabs share screen names e.g. home + members)
  const visibleScreenNames = new Set(activeTabs.map((key) => TAB_REGISTRY[key].screenName));

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.secondary.light,
          borderTopColor: colors.border.light,
        },
        tabBarActiveTintColor: colors.accent.light,
        tabBarInactiveTintColor: colors.textSecondary.light,
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
        },
      }}
    >
      {/* Render active tab screens */}
      {activeTabs.map((tabKey) => {
        const tab = TAB_REGISTRY[tabKey];
        const { Icon } = tab;
        return (
          <Tabs.Screen
            key={tabKey}
            name={tab.screenName}
            options={{
              title: tab.label,
              tabBarIcon: ({ color, size }) => <Icon color={color} size={size} />,
            }}
          />
        );
      })}

      {/* Hidden screens for non-active tabs (needed for navigation to still work) */}
      {ALL_SCREEN_NAMES.filter((name) => !visibleScreenNames.has(name)).map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{ href: null }}
        />
      ))}
    </Tabs>
  );
}
