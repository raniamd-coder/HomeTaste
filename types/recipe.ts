export type RecipeCategory = 'dessert' | 'jus' | 'plat' | 'entree' | 'snack' | 'autre';

export type Recipe = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  ingredients: string;
  category: RecipeCategory;
  calories: number | null;
  image_url: string | null;
  created_at: string;
};

export type RecipeCreateInput = {
  title: string;
  description: string;
  ingredients: string;
  category: RecipeCategory;
  calories: number | null;
  image_url: string | null;
};

export type RecipeUpdateInput = Partial<RecipeCreateInput>;
