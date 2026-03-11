import React, { useCallback, useEffect, useMemo, useState } from 'react';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../components/Screen';
import { Button, ErrorBanner } from '../components/ui';
import { RecipeCard } from '../components/RecipeCard';
import { useColors } from '../context/ThemeContext';
import type { RecipesStackParamList } from '../navigation/types';
import { recipeService } from '../services/recipeService';
import type { Recipe } from '../types/recipe';
import type { ThemeColors } from '../theme';
import { spacing } from '../theme';

type Props = NativeStackScreenProps<RecipesStackParamList, 'RecipeList'>;

type CategoryId = 'all' | 'dessert' | 'jus' | 'plat' | 'entree' | 'snack' | 'autre';

const CATEGORIES: Array<{ id: CategoryId; label: string }> = [
  { id: 'all', label: 'Tous' },
  { id: 'dessert', label: 'Dessert' },
  { id: 'jus', label: 'Jus' },
  { id: 'plat', label: 'Plat' },
  { id: 'entree', label: 'Entrée' },
  { id: 'snack', label: 'Snack' },
  { id: 'autre', label: 'Autre' },
];

function categoryIcon(id: CategoryId) {
  if (id === 'all') return 'apps-outline';
  if (id === 'dessert') return 'ice-cream-outline';
  if (id === 'jus') return 'water-outline';
  if (id === 'plat') return 'restaurant-outline';
  if (id === 'entree') return 'leaf-outline';
  if (id === 'snack') return 'fast-food-outline';
  return 'help-circle-outline';
}

function matchesCategory(recipe: Recipe, category: CategoryId) {
  if (category === 'all') return true;

  // Prefer the explicit DB category if present.
  const recipeCategory = (recipe as any).category as CategoryId | undefined;
  if (recipeCategory && recipeCategory !== 'all') {
    return recipeCategory === category;
  }

  // Fallback (older DB without column yet): guess from text.
  const text = `${recipe.title} ${recipe.description} ${recipe.ingredients}`.toLowerCase();

  const hasAny = (keywords: string[]) => keywords.some((k) => text.includes(k));

  if (category === 'dessert') return hasAny(['dessert', 'gâteau', 'gateau', 'tarte', 'crêpe', 'crepe', 'cookie', 'chocolat']);
  if (category === 'jus') return hasAny(['jus', 'smoothie', 'milkshake', 'shake']);
  if (category === 'plat') return hasAny(['plat', 'poulet', 'viande', 'poisson', 'riz', 'pâtes', 'pates', 'pasta', 'curry']);
  if (category === 'entree') return hasAny(['entrée', 'entree', 'salade', 'soupe', 'velouté', 'veloute']);
  if (category === 'snack') return hasAny(['snack', 'goûter', 'gouter', 'sandwich', 'toast', 'wrap']);
  if (category === 'autre') return true;
  return true;
}

export function RecipeListScreen({ navigation }: Props) {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryId>('all');

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => matchesCategory(r, category));
  }, [category, recipes]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await recipeService.listMyRecipes();
      setRecipes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      load();
    });
    return unsubscribe;
  }, [load, navigation]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <Screen>
      {error ? <ErrorBanner message={error} /> : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {CATEGORIES.map((c) => {
          const selected = c.id === category;
          const ringColor = selected ? colors.primary : colors.border;
          const iconColor = selected ? colors.primary : colors.mutedText;
          const labelColor = selected ? colors.text : colors.mutedText;

          return (
            <Pressable
              key={c.id}
              onPress={() => setCategory(c.id)}
              style={styles.storyItem}
            >
              <View style={[styles.storyRing, { borderColor: ringColor }]}>
                <View style={[styles.storyCircle, { backgroundColor: colors.surface }]}
                >
                  <Ionicons name={categoryIcon(c.id) as any} size={22} color={iconColor} />
                </View>
              </View>
              <Text numberOfLines={1} style={[styles.storyLabel, { color: labelColor }]}>
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading && recipes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.muted}>Chargement…</Text>
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Aucune recette</Text>
          <Text style={styles.muted}>Ajoutez votre première recette.</Text>
          <View style={{ height: spacing.md }} />
          <Button label="Ajouter une recette" onPress={() => navigation.navigate('AddEditRecipe')} />
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyFiltered}>
              <Text style={styles.emptyTitle}>Aucune recette</Text>
              <Text style={styles.muted}>Dans cette catégorie.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <RecipeCard recipe={item} onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })} />
          )}
        />
      )}
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    categories: {
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      gap: spacing.md,
    },
    storyItem: {
      width: 74,
      alignItems: 'center',
    },
    storyRing: {
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    storyCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    storyLabel: {
      marginTop: 6,
      fontSize: 12,
      fontWeight: '800',
      textAlign: 'center',
    },
    list: {
      paddingBottom: spacing.xl,
      paddingTop: spacing.sm,
    },
    empty: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: spacing.xl,
    },
    emptyFiltered: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    muted: {
      color: colors.mutedText,
    },
  });
}
