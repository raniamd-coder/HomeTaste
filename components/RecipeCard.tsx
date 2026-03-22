import React from 'react';

import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Recipe } from '../types/recipe';
import { useColors } from '../context/ThemeContext';
import type { ThemeColors } from '../theme';
import { radius, spacing } from '../theme';

function categoryLabel(category?: string) {
  if (!category) return '';
  if (category === 'dessert') return 'Dessert';
  if (category === 'jus') return 'Jus';
  if (category === 'plat') return 'Plat';
  if (category === 'entree') return 'Entrée';
  if (category === 'snack') return 'Snack';
  if (category === 'autre') return 'Autre';
  return category;
}

type Props = {
  recipe: Recipe;
  onPress: () => void;
};

export function RecipeCard({ recipe, onPress }: Props) {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const category = categoryLabel((recipe as any).category as string | undefined);

  return (
    <Pressable onPress={onPress} style={styles.card}>
      {recipe.image_url ? <Image source={{ uri: recipe.image_url }} style={styles.image} /> : <View style={styles.imagePlaceholder} />}
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>
          {recipe.title}
        </Text>
        {!!category && (
          <Text numberOfLines={1} style={styles.category}>
            {category}
          </Text>
        )}
        {!!recipe.description && (
          <Text numberOfLines={2} style={styles.subtitle}>
            {recipe.description}
          </Text>
        )}
        {typeof recipe.calories === 'number' && recipe.calories > 0 ? (
          <Text style={styles.calories}>{recipe.calories} kcal</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: spacing.md,
    },
    image: {
      width: '100%',
      height: 150,
    },
    imagePlaceholder: {
      width: '100%',
      height: 110,
      backgroundColor: colors.border,
    },
    content: {
      padding: spacing.md,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    category: {
      marginTop: spacing.xs,
      color: colors.mutedText,
      fontWeight: '700',
      fontSize: 12,
    },
    subtitle: {
      marginTop: spacing.xs,
      color: colors.mutedText,
      lineHeight: 18,
    },
    calories: {
      marginTop: spacing.sm,
      color: colors.primary,
      fontWeight: '800',
      fontSize: 12,
    },
  });
}
