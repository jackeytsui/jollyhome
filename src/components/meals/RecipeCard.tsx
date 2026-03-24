import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Heart, Plus, Pencil } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { Recipe } from '@/types/recipes';

interface RecipeCardProps {
  recipe: Recipe;
  onToggleFavorite: (recipe: Recipe) => void;
  onEdit: (recipe: Recipe) => void;
  onUse: (recipe: Recipe) => void;
}

export function RecipeCard({ recipe, onToggleFavorite, onEdit, onUse }: RecipeCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.title}>{recipe.title}</Text>
          <Text style={styles.meta}>
            {recipe.servings ? `${recipe.servings} servings` : 'Flexible servings'}
            {recipe.totalMinutes ? ` • ${recipe.totalMinutes} min` : ''}
          </Text>
        </View>
        <Pressable onPress={() => onToggleFavorite(recipe)} style={styles.iconButton}>
          <Heart
            size={18}
            color={recipe.favorite ? colors.destructive.light : colors.textSecondary.light}
            fill={recipe.favorite ? colors.destructive.light : 'transparent'}
          />
        </Pressable>
      </View>

      {recipe.summary ? <Text style={styles.summary}>{recipe.summary}</Text> : null}

      {recipe.tags.length > 0 ? (
        <View style={styles.tags}>
          {recipe.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagLabel}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable onPress={() => onEdit(recipe)} style={styles.actionButton}>
          <Pencil size={16} color={colors.textPrimary.light} />
          <Text style={styles.actionLabel}>Edit</Text>
        </Pressable>
        <Pressable onPress={() => onUse(recipe)} style={[styles.actionButton, styles.primaryAction]}>
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.primaryActionLabel}>Plan meal</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  meta: {
    color: colors.textSecondary.light,
    fontSize: 13,
  },
  summary: {
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.dominant.light,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  tagLabel: {
    fontSize: 12,
    color: colors.textPrimary.light,
  },
  iconButton: {
    padding: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.dominant.light,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  actionLabel: {
    color: colors.textPrimary.light,
    fontWeight: '600',
  },
  primaryAction: {
    backgroundColor: colors.accent.light,
    borderColor: colors.accent.light,
  },
  primaryActionLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
