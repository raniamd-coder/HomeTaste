import React, { useCallback, useEffect, useMemo, useState } from 'react';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../components/Screen';
import { Button, ErrorBanner, Field } from '../components/ui';
import { useColors } from '../context/ThemeContext';
import type { RecipesStackParamList } from '../navigation/types';
import { recipeService } from '../services/recipeService';
import type { Recipe, RecipeCategory } from '../types/recipe';
import type { ThemeColors } from '../theme';
import { radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RecipesStackParamList, 'AddEditRecipe'>;

const CATEGORIES: Array<{ id: RecipeCategory; label: string }> = [
  { id: 'dessert', label: 'Dessert' },
  { id: 'jus', label: 'Jus' },
  { id: 'plat', label: 'Plat' },
  { id: 'entree', label: 'Entrée' },
  { id: 'snack', label: 'Snack' },
  { id: 'autre', label: 'Autre' },
];

function categoryIcon(id: RecipeCategory) {
  if (id === 'dessert') return 'ice-cream-outline';
  if (id === 'jus') return 'water-outline';
  if (id === 'plat') return 'restaurant-outline';
  if (id === 'entree') return 'leaf-outline';
  if (id === 'snack') return 'fast-food-outline';
  return 'help-circle-outline';
}

export function AddEditRecipeScreen({ navigation, route }: Props) {
  const recipeId = route.params && 'recipeId' in route.params ? route.params.recipeId : undefined;
  const isEdit = Boolean(recipeId);

  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(false);
  const [loadingRecipe, setLoadingRecipe] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [category, setCategory] = useState<RecipeCategory>('plat');

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setError(null);
    setTitle('');
    setDescription('');
    setIngredients('');
    setCategory('plat');
    setImageUrl(null);
    setLocalImageUri(null);
  }, []);

  const canSubmit = useMemo(() => title.trim().length > 0, [title]);

  const loadRecipe = useCallback(async () => {
    if (!recipeId) return;
    setError(null);
    setLoadingRecipe(true);
    try {
      const recipe: Recipe = await recipeService.getMyRecipe(recipeId);
      setTitle(recipe.title);
      setDescription(recipe.description);
      setIngredients(recipe.ingredients);
      setCategory(((recipe as any).category as RecipeCategory) ?? 'plat');
      setImageUrl(recipe.image_url);
      navigation.setOptions({ title: 'Modifier' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingRecipe(false);
    }
  }, [navigation, recipeId]);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Modifier' : 'Ajouter' });
  }, [isEdit, navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // When using tabs, this screen can stay mounted.
      // In add mode, clear the form whenever the screen is focused.
      if (!isEdit) resetForm();
    });
    return unsubscribe;
  }, [isEdit, navigation, resetForm]);

  useEffect(() => {
    loadRecipe();
  }, [loadRecipe]);

  async function takePhoto() {
    setError(null);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== ImagePicker.PermissionStatus.GRANTED) {
      Alert.alert(
        'Permission caméra',
        "Accès refusé. Activez l'autorisation caméra dans les réglages pour prendre une photo."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.75,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    setLocalImageUri(asset.uri);
  }

  async function pickFromLibrary() {
    setError(null);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== ImagePicker.PermissionStatus.GRANTED) {
      Alert.alert(
        'Permission photos',
        "Accès refusé. Activez l'autorisation Photos dans les réglages pour choisir une image."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    setLocalImageUri(asset.uri);
  }

  async function onSave() {
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      let finalImageUrl = imageUrl;
      if (localImageUri) {
        finalImageUrl = await recipeService.uploadRecipeImage(localImageUri);
      }

      if (isEdit && recipeId) {
        await recipeService.updateMyRecipe(recipeId, {
          title: title.trim(),
          description: description.trim(),
          ingredients: ingredients.trim(),
          category,
          image_url: finalImageUrl,
        });
        navigation.goBack();
      } else {
        await recipeService.createMyRecipe({
          title: title.trim(),
          description: description.trim(),
          ingredients: ingredients.trim(),
          category,
          image_url: finalImageUrl,
        });
        resetForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      {error ? <ErrorBanner message={error} /> : null}

      {loadingRecipe ? <Text style={styles.muted}>Chargement…</Text> : null}

      <View style={styles.imageWrap}>
        {localImageUri ? (
          <Image source={{ uri: localImageUri }} style={styles.image} />
        ) : imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>Aucune image</Text>
          </View>
        )}

        <View style={{ height: spacing.sm }} />
        <Button label="Prendre une photo" onPress={takePhoto} variant="ghost" />
        <View style={{ height: spacing.sm }} />
        <Button label="Choisir depuis la galerie" onPress={pickFromLibrary} variant="ghost" />
      </View>

      <Field label="Titre" value={title} onChangeText={setTitle} placeholder="Ex: Tarte aux pommes" />
      <Field
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Courte description"
        multiline
      />
      <Field
        label="Ingrédients"
        value={ingredients}
        onChangeText={setIngredients}
        placeholder="Liste des ingrédients (texte)"
        multiline
      />

      <Text style={styles.sectionTitle}>Catégorie</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
        {CATEGORIES.map((c) => {
          const selected = c.id === category;
          const ringColor = selected ? colors.primary : colors.border;
          const iconColor = selected ? colors.primary : colors.mutedText;
          const labelColor = selected ? colors.text : colors.mutedText;

          return (
            <Pressable key={c.id} onPress={() => setCategory(c.id)} style={styles.storyItem}>
              <View style={[styles.storyRing, { borderColor: ringColor }]}>
                <View style={[styles.storyCircle, { backgroundColor: colors.surface }]}>
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

      <Button label={isEdit ? 'Enregistrer' : 'Ajouter'} onPress={onSave} disabled={!canSubmit} loading={loading} />

      
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    imageWrap: {
      marginBottom: spacing.lg,
    },
    image: {
      width: '100%',
      height: 220,
      borderRadius: radius.lg,
      backgroundColor: colors.border,
    },
    imagePlaceholder: {
      width: '100%',
      height: 160,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    imagePlaceholderText: {
      color: colors.mutedText,
      fontWeight: '600',
    },
    hint: {
      marginTop: spacing.sm,
      color: colors.mutedText,
      lineHeight: 18,
      fontSize: 12,
    },
    muted: {
      color: colors.mutedText,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      fontWeight: '800',
      color: colors.text,
    },
    categories: {
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
  });
}
