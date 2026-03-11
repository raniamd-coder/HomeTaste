export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AddEditRecipeRouteParams = { recipeId?: string } | undefined;

export type RecipesStackParamList = {
  RecipeList: undefined;
  RecipeDetail: { recipeId: string };
  AddEditRecipe: AddEditRecipeRouteParams;
};

export type AddStackParamList = {
  AddEditRecipe: AddEditRecipeRouteParams;
};

export type ProfileStackParamList = {
  Settings: undefined;
  Account: undefined;
};
