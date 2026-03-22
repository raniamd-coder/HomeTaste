import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

import type { Recipe, RecipeCreateInput, RecipeUpdateInput } from '../types/recipe';
import { EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_SUPABASE_URL, RECIPE_IMAGES_BUCKET, RECIPES_TABLE, supabase } from './supabase';

const CACHE_KEY_PREFIX = 'hometaste:recipes:';

function cacheKey(userId: string) {
  return `${CACHE_KEY_PREFIX}${userId}`;
}

function isCaloriesSchemaCacheError(message: string) {
  const msg = message.toLowerCase();
  return msg.includes('calories') && msg.includes('schema cache');
}

async function getUserIdOrThrow() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  const userId = data.user?.id;
  if (!userId) throw new Error('Utilisateur non connecté');
  return userId;
}

export const recipeService = {
  async listMyRecipes(): Promise<Recipe[]> {
    const userId = await getUserIdOrThrow();

    try {
      const { data, error } = await supabase
        .from(RECIPES_TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      const recipes = (data ?? []) as Recipe[];
      await AsyncStorage.setItem(cacheKey(userId), JSON.stringify(recipes));
      return recipes;
    } catch (err) {
      const cached = await AsyncStorage.getItem(cacheKey(userId));
      if (cached) return JSON.parse(cached) as Recipe[];
      throw err;
    }
  },

  async getMyRecipe(recipeId: string): Promise<Recipe> {
    const userId = await getUserIdOrThrow();

    const { data, error } = await supabase
      .from(RECIPES_TABLE)
      .select('*')
      .eq('id', recipeId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Recette introuvable');
    return data as Recipe;
  },

  async createMyRecipe(input: RecipeCreateInput): Promise<Recipe> {
    const userId = await getUserIdOrThrow();

    let { data, error } = await supabase
      .from(RECIPES_TABLE)
      .insert({
        user_id: userId,
        title: input.title,
        description: input.description,
        ingredients: input.ingredients,
        category: input.category,
        calories: input.calories,
        image_url: input.image_url,
      })
      .select('*')
      .single();

    if (error && isCaloriesSchemaCacheError(error.message || '')) {
      // Temporary compatibility path when remote schema cache doesn't expose calories yet.
      const retry = await supabase
        .from(RECIPES_TABLE)
        .insert({
          user_id: userId,
          title: input.title,
          description: input.description,
          ingredients: input.ingredients,
          category: input.category,
          image_url: input.image_url,
        })
        .select('*')
        .single();

      data = retry.data;
      error = retry.error;
    }

    if (error) {
      const msg = error.message || 'Erreur inconnue';
      if (msg.toLowerCase().includes('column') && msg.toLowerCase().includes('category') && msg.toLowerCase().includes('does not exist')) {
        throw new Error("Base de données non mise à jour: la colonne 'category' manque. Exécutez le SQL: supabase/add_category.sql puis réessayez.");
      }
      if (msg.toLowerCase().includes('column') && msg.toLowerCase().includes('calories') && msg.toLowerCase().includes('does not exist')) {
        throw new Error("Base de données non mise à jour: la colonne 'calories' manque. Exécutez le SQL: supabase/add_calories.sql puis réessayez.");
      }
      throw new Error(msg);
    }
    return data as Recipe;
  },

  async updateMyRecipe(recipeId: string, input: RecipeUpdateInput): Promise<Recipe> {
    const userId = await getUserIdOrThrow();

    let { data, error } = await supabase
      .from(RECIPES_TABLE)
      .update({
        title: input.title,
        description: input.description,
        ingredients: input.ingredients,
        category: input.category,
        calories: input.calories,
        image_url: input.image_url,
      })
      .eq('id', recipeId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error && isCaloriesSchemaCacheError(error.message || '')) {
      const retry = await supabase
        .from(RECIPES_TABLE)
        .update({
          title: input.title,
          description: input.description,
          ingredients: input.ingredients,
          category: input.category,
          image_url: input.image_url,
        })
        .eq('id', recipeId)
        .eq('user_id', userId)
        .select('*')
        .single();

      data = retry.data;
      error = retry.error;
    }

    if (error) {
      const msg = error.message || 'Erreur inconnue';
      if (msg.toLowerCase().includes('column') && msg.toLowerCase().includes('category') && msg.toLowerCase().includes('does not exist')) {
        throw new Error("Base de données non mise à jour: la colonne 'category' manque. Exécutez le SQL: supabase/add_category.sql puis réessayez.");
      }
      if (msg.toLowerCase().includes('column') && msg.toLowerCase().includes('calories') && msg.toLowerCase().includes('does not exist')) {
        throw new Error("Base de données non mise à jour: la colonne 'calories' manque. Exécutez le SQL: supabase/add_calories.sql puis réessayez.");
      }
      throw new Error(msg);
    }
    return data as Recipe;
  },

  async deleteMyRecipe(recipeId: string): Promise<void> {
    const userId = await getUserIdOrThrow();

    const { error } = await supabase
      .from(RECIPES_TABLE)
      .delete()
      .eq('id', recipeId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  },

  async uploadRecipeImage(localUri: string): Promise<string> {
    const userId = await getUserIdOrThrow();

    if (!EXPO_PUBLIC_SUPABASE_URL || !EXPO_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error("Supabase n'est pas configuré (URL/anon key manquantes)");
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error(sessionError.message);
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) throw new Error('Session expirée, reconnectez-vous');

    const extension = 'jpg';
    const path = `${userId}/${Date.now()}.${extension}`;

    // Use REST API upload to avoid React Native fetch(file://) issues.
    const uploadUrl = `${EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/${encodeURIComponent(
      RECIPE_IMAGES_BUCKET
    )}/${path}`;

    const result = await FileSystem.uploadAsync(uploadUrl, localUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Content-Type': 'image/jpeg',
        apikey: EXPO_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (result.status < 200 || result.status >= 300) {
      const body = result.body || '';
      const text = body.toLowerCase();
      if (
        result.status === 401 ||
        result.status === 403 ||
        text.includes('row level security') ||
        text.includes('violates row level security') ||
        text.includes('unauthorized')
      ) {
        throw new Error(
          "Upload image refusé (RLS/Unauthorized). Vérifiez dans Supabase: (1) Storage → bucket 'recipe-images' existe, (2) exécutez supabase/storage_policies.sql dans SQL Editor, (3) bucket en Public si vous utilisez des URLs publiques."
        );
      }

      throw new Error(`Upload image échoué (HTTP ${result.status}): ${body || '—'}`);
    }

    // Public URL (requires the bucket to be public).
    return `${EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${RECIPE_IMAGES_BUCKET}/${path}`;
  },
};
