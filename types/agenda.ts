export type AgendaEntry = {
  id: string;
  recipe_id: string;
  recipe_title: string;
  done_on: string;
  calories: number;
  created_at: string;
};

export type AgendaEntryCreateInput = {
  recipe_id: string;
  recipe_title: string;
  done_on: string;
  calories: number;
};
