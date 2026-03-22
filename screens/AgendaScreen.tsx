import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../components/Screen';
import { ErrorBanner } from '../components/ui';
import { useColors } from '../context/ThemeContext';
import { estimateCaloriesFromIngredients } from '../services/calorieEstimator';
import { agendaService } from '../services/agendaService';
import { recipeService } from '../services/recipeService';
import type { AgendaEntry } from '../types/agenda';
import type { Recipe } from '../types/recipe';
import type { ThemeColors } from '../theme';
import { radius, spacing } from '../theme';

function formatLocalDate(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toPrettyDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function getMonthCalendarCells(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (firstDay.getDay() + 6) % 7;

  const cells: Array<string | null> = [];
  for (let i = 0; i < leadingBlanks; i += 1) cells.push(null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(formatLocalDate(new Date(year, month, day)));
  }

  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function AgendaScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [entries, setEntries] = useState<AgendaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRecipeId, setSavingRecipeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(formatLocalDate(new Date()));

  const monthLabel = useMemo(() => getMonthLabel(currentMonth), [currentMonth]);
  const monthCells = useMemo(() => getMonthCalendarCells(currentMonth), [currentMonth]);

  const entriesByDate = useMemo(() => {
    const map: Record<string, AgendaEntry[]> = {};
    for (const entry of entries) {
      if (!map[entry.done_on]) map[entry.done_on] = [];
      map[entry.done_on].push(entry);
    }
    return map;
  }, [entries]);

  const selectedDayEntries = useMemo(() => entriesByDate[selectedDate] ?? [], [entriesByDate, selectedDate]);
  const selectedDayTotal = useMemo(
    () => selectedDayEntries.reduce((sum, e) => sum + e.calories, 0),
    [selectedDayEntries]
  );

  const totalsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const entry of entries) {
      map[entry.done_on] = (map[entry.done_on] ?? 0) + entry.calories;
    }
    return Object.entries(map)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, total]) => ({ date, total }));
  }, [entries]);

  const today = formatLocalDate(new Date());
  const todayTotal = useMemo(
    () => entries.filter((e) => e.done_on === today).reduce((sum, e) => sum + e.calories, 0),
    [entries, today]
  );

  const loadData = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [recipeData, agendaData] = await Promise.all([
        recipeService.listMyRecipes(),
        agendaService.listMyEntries(),
      ]);
      setRecipes(recipeData);
      setEntries(agendaData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function addRecipeToSelectedDate(recipe: Recipe) {
    const recipeCalories =
      typeof recipe.calories === 'number' && recipe.calories > 0
        ? recipe.calories
        : estimateCaloriesFromIngredients(recipe.ingredients || '');

    if (recipeCalories <= 0) {
      Alert.alert('Calories indisponibles', 'Impossible de calculer les calories pour cette recette.');
      return;
    }

    setSavingRecipeId(recipe.id);
    setError(null);
    try {
      await agendaService.addMyEntry({
        recipe_id: recipe.id,
        recipe_title: recipe.title,
        done_on: selectedDate,
        calories: Math.round(recipeCalories),
      });

      const next = await agendaService.listMyEntries();
      setEntries(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSavingRecipeId(null);
    }
  }

  function moveMonth(delta: number) {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  async function removeEntry(entry: AgendaEntry) {
    Alert.alert('Supprimer', `Supprimer "${entry.recipe_title}" du ${toPrettyDate(entry.done_on)} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await agendaService.deleteMyEntry(entry.id);
              const next = await agendaService.listMyEntries();
              setEntries(next);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Erreur inconnue');
            }
          })();
        },
      },
    ]);
  }

  return (
    <Screen scroll>
      {error ? <ErrorBanner message={error} /> : null}

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Agenda Recettes</Text>
        <Text style={styles.heroSub}>Aujourd'hui: {todayTotal} kcal</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.monthHeader}>
          <Pressable onPress={() => moveMonth(-1)} style={styles.monthNavBtn}>
            <Text style={styles.monthNavText}>{'<'}</Text>
          </Pressable>
          <Text style={styles.sectionTitle}>{monthLabel}</Text>
          <Pressable onPress={() => moveMonth(1)} style={styles.monthNavBtn}>
            <Text style={styles.monthNavText}>{'>'}</Text>
          </Pressable>
        </View>

        {loading ? <Text style={styles.muted}>Chargement des recettes...</Text> : null}

        <View style={styles.weekHeaderRow}>
          {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((d) => (
            <Text key={d} style={styles.weekHeaderCell}>{d}</Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {monthCells.map((cell, idx) => {
            if (!cell) return <View key={`blank-${idx}`} style={styles.dayCellBlank} />;

            const dayEntries = entriesByDate[cell] ?? [];
            const isSelected = cell === selectedDate;
            const isToday = cell === today;

            return (
              <Pressable
                key={cell}
                onPress={() => setSelectedDate(cell)}
                style={[
                  styles.dayCell,
                  isSelected ? { borderColor: colors.primary, backgroundColor: colors.highlight } : null,
                ]}
              >
                <Text style={[styles.dayText, isToday ? { color: colors.primary } : null]}>{cell.slice(8)}</Text>
                {dayEntries.length > 0 ? (
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>{dayEntries.length}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Ajouter automatiquement au {toPrettyDate(selectedDate)}</Text>
        <Text style={styles.muted}>Touchez une recette pour l'ajouter directement.</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recipeChipsWrap}>
          {recipes.map((recipe) => {
            const recipeCalories =
              typeof recipe.calories === 'number' && recipe.calories > 0
                ? recipe.calories
                : estimateCaloriesFromIngredients(recipe.ingredients || '');

            const saving = savingRecipeId === recipe.id;

            return (
              <Pressable
                key={recipe.id}
                style={styles.recipeChip}
                onPress={() => addRecipeToSelectedDate(recipe)}
                disabled={saving}
              >
                <Text style={styles.recipeChipText} numberOfLines={1}>{recipe.title}</Text>
                <Text style={styles.recipeChipKcal}>{Math.round(recipeCalories)} kcal</Text>
                {saving ? <Text style={styles.recipeChipSaving}>Ajout...</Text> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ height: spacing.lg }} />

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Archive du {toPrettyDate(selectedDate)}</Text>
        <Text style={styles.totalSelected}>Total: {selectedDayTotal} kcal</Text>
        {selectedDayEntries.length === 0 ? (
          <Text style={styles.muted}>Aucune recette planifiée.</Text>
        ) : (
          selectedDayEntries.map((entry) => (
            <View key={entry.id} style={styles.entryRow}>
              <View style={styles.entryMain}>
                <Text style={styles.entryTitle}>{entry.recipe_title}</Text>
                <Text style={styles.muted}>{toPrettyDate(entry.done_on)} • {entry.calories} kcal</Text>
              </View>
              <Pressable onPress={() => removeEntry(entry)} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>Supprimer</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>

      <View style={{ height: spacing.lg }} />

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Récapitulatif calories</Text>
        {totalsByDate.length === 0 ? (
          <Text style={styles.muted}>Aucune donnée pour le moment.</Text>
        ) : (
          totalsByDate.slice(0, 10).map((item) => (
            <View key={item.date} style={styles.totalRow}>
              <Text style={styles.totalDate}>{toPrettyDate(item.date)}</Text>
              <Text style={styles.totalValue}>{item.total} kcal</Text>
            </View>
          ))
        )}
      </View>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    heroCard: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.highlight,
      borderRadius: radius.lg,
      padding: spacing.lg,
    },
    heroTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    heroSub: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '700',
    },
    card: {
      marginTop: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    muted: {
      color: colors.mutedText,
    },
    monthHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    monthNavBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    monthNavText: {
      color: colors.text,
      fontWeight: '800',
      fontSize: 16,
    },
    weekHeaderRow: {
      flexDirection: 'row',
      marginBottom: spacing.sm,
    },
    weekHeaderCell: {
      flex: 1,
      textAlign: 'center',
      color: colors.mutedText,
      fontWeight: '700',
      fontSize: 12,
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    dayCell: {
      width: '13.6%',
      minHeight: 46,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    dayCellBlank: {
      width: '13.6%',
      minHeight: 46,
    },
    dayText: {
      color: colors.text,
      fontWeight: '800',
      fontSize: 12,
    },
    dayBadge: {
      marginTop: 2,
      backgroundColor: colors.primary,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    dayBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '800',
    },
    recipeChipsWrap: {
      gap: spacing.sm,
      paddingBottom: spacing.md,
      paddingRight: spacing.sm,
    },
    recipeChip: {
      width: 180,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
    },
    recipeChipText: {
      fontWeight: '700',
      fontSize: 13,
      color: colors.text,
    },
    recipeChipKcal: {
      marginTop: 3,
      color: colors.primary,
      fontWeight: '700',
      fontSize: 12,
    },
    recipeChipSaving: {
      marginTop: 4,
      color: colors.mutedText,
      fontSize: 11,
      fontWeight: '700',
    },
    totalSelected: {
      color: colors.primary,
      fontWeight: '900',
      marginBottom: spacing.md,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    totalDate: {
      color: colors.text,
      fontWeight: '700',
    },
    totalValue: {
      color: colors.primary,
      fontWeight: '900',
    },
    entryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    entryMain: {
      flex: 1,
    },
    entryTitle: {
      fontWeight: '800',
      color: colors.text,
      marginBottom: 2,
    },
    deleteBtn: {
      borderWidth: 1,
      borderColor: colors.danger,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 8,
    },
    deleteText: {
      color: colors.danger,
      fontWeight: '800',
      fontSize: 12,
    },
  });
}
