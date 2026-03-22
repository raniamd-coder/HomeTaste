import React, { useCallback, useEffect, useState } from 'react';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../components/Screen';
import { Button, ErrorBanner } from '../components/ui';
import { useColors } from '../context/ThemeContext';
import type { RecipesStackParamList } from '../navigation/types';
import { recipeService } from '../services/recipeService';
import type { Recipe } from '../types/recipe';
import type { ThemeColors } from '../theme';
import { radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RecipesStackParamList, 'RecipeDetail'>;

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

export function RecipeDetailScreen({ navigation, route }: Props) {
  const { recipeId } = route.params;

  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await recipeService.getMyRecipe(recipeId);
      setRecipe(data);
      navigation.setOptions({ title: data.title || 'Détail' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [navigation, recipeId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      load();
    });
    return unsubscribe;
  }, [load, navigation]);

  async function onDelete() {
    Alert.alert('Supprimer', 'Supprimer cette recette ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await recipeService.deleteMyRecipe(recipeId);
            navigation.goBack();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
          }
        },
      },
    ]);
  }

  if (loading && !recipe) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Chargement…</Text>
      </View>
    );
  }

  return (
    <Screen scroll>
      {error ? <ErrorBanner message={error} /> : null}

      {recipe?.image_url ? <Image source={{ uri: recipe.image_url }} style={styles.image} /> : null}

      <View style={styles.card}>
        <Text style={styles.title}>{recipe?.title}</Text>
        {(() => {
          const label = categoryLabel((recipe as any)?.category as string | undefined);
          return label ? <Text style={styles.category}>{label}</Text> : null;
        })()}
        {!!recipe?.description && <Text style={styles.text}>{recipe.description}</Text>}

        {typeof recipe?.calories === 'number' && recipe.calories > 0 ? (
          <Text style={styles.calories}>{recipe.calories} kcal</Text>
        ) : null}

        <Text style={styles.sectionTitle}>Ingrédients</Text>
        <Text style={styles.text}>{recipe?.ingredients || '—'}</Text>
      </View>

      <View style={styles.actions}>
        <Button label="Modifier" onPress={() => navigation.navigate('AddEditRecipe', { recipeId })} />
        <View style={{ height: spacing.sm }} />
        <Button label="Supprimer" onPress={onDelete} variant="danger" />
      </View>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    image: {
      width: '100%',
      height: 220,
      borderRadius: radius.lg,
      marginBottom: spacing.lg,
      backgroundColor: colors.border,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.lg,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    category: {
      marginBottom: spacing.sm,
      color: colors.mutedText,
      fontWeight: '800',
      fontSize: 12,
    },
    sectionTitle: {
      marginTop: spacing.lg,
      marginBottom: spacing.xs,
      fontWeight: '800',
      color: colors.text,
    },
    text: {
      color: colors.mutedText,
      lineHeight: 20,
    },
    calories: {
      marginTop: spacing.sm,
      color: colors.primary,
      fontWeight: '800',
    },
    muted: {
      color: colors.mutedText,
    },
    actions: {
      marginTop: spacing.lg,
    },
  });
}
