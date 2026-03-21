import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/theme';
import { suggestCategory } from '@/lib/expenseMath';

const CATEGORIES = [
  'Groceries',
  'Dining',
  'Utilities',
  'Rent',
  'Transport',
  'Entertainment',
  'Healthcare',
  'Household',
  'Other',
];

interface CategoryChipSuggestionProps {
  description: string;
  selectedCategory: string | null;
  onSelect: (category: string) => void;
}

export function CategoryChipSuggestion({
  description,
  selectedCategory,
  onSelect,
}: CategoryChipSuggestionProps) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const suggested = suggestCategory(description);
      setSuggestion(suggested);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [description]);

  const displayCategory = selectedCategory ?? suggestion;

  function handleChipPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPickerVisible(true);
  }

  function handleSelectCategory(category: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(category);
    setPickerVisible(false);
  }

  if (!displayCategory && !description) return null;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleChipPress}
        style={[
          styles.chip,
          displayCategory ? styles.chipSelected : styles.chipDefault,
        ]}
      >
        <Text
          style={[
            styles.chipText,
            displayCategory ? styles.chipTextSelected : styles.chipTextDefault,
          ]}
        >
          {displayCategory ?? 'Select category'}
        </Text>
      </Pressable>

      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPickerVisible(false)}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Choose Category</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.pickerItem,
                    selectedCategory === cat && styles.pickerItemSelected,
                  ]}
                  onPress={() => handleSelectCategory(cat)}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedCategory === cat && styles.pickerItemTextSelected,
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    minHeight: 28,
    justifyContent: 'center',
  },
  chipDefault: {
    backgroundColor: colors.secondary.light,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  chipSelected: {
    backgroundColor: colors.accent.light,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  chipTextDefault: {
    color: colors.textSecondary.light,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: colors.dominant.light,
    borderRadius: 16,
    padding: 16,
    width: '80%',
    maxHeight: 400,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  pickerItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  pickerItemSelected: {
    backgroundColor: colors.secondary.light,
  },
  pickerItemText: {
    fontSize: 16,
    color: colors.textPrimary.light,
    lineHeight: 24,
  },
  pickerItemTextSelected: {
    fontWeight: '600',
    color: colors.accent.light,
  },
});
