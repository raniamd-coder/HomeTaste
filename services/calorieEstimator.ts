const INGREDIENT_KCAL_PER_100G: Array<{ pattern: RegExp; kcal: number }> = [
  { pattern: /huile|olive|tournesol|beurre/i, kcal: 884 },
  { pattern: /sucre|miel|sirop/i, kcal: 400 },
  { pattern: /farine/i, kcal: 364 },
  { pattern: /riz/i, kcal: 360 },
  { pattern: /p[aâ]tes|pasta/i, kcal: 350 },
  { pattern: /pain/i, kcal: 265 },
  { pattern: /pomme de terre/i, kcal: 77 },
  { pattern: /fromage|mozzarella|cheddar|parmesan/i, kcal: 360 },
  { pattern: /lait/i, kcal: 60 },
  { pattern: /yaourt/i, kcal: 95 },
  { pattern: /oeuf|oeufs|egg/i, kcal: 155 },
  { pattern: /poulet/i, kcal: 165 },
  { pattern: /boeuf|steak|viande/i, kcal: 250 },
  { pattern: /poisson|saumon|thon/i, kcal: 180 },
  { pattern: /avocat/i, kcal: 160 },
  { pattern: /banane/i, kcal: 89 },
  { pattern: /pomme/i, kcal: 52 },
  { pattern: /chocolat/i, kcal: 550 },
  { pattern: /amande|noix|cacahu[eè]te/i, kcal: 600 },
  { pattern: /l[eé]gume|carotte|tomate|oignon|courgette|poivron/i, kcal: 35 },
];

function findKcalPer100g(text: string): number | null {
  for (const item of INGREDIENT_KCAL_PER_100G) {
    if (item.pattern.test(text)) return item.kcal;
  }
  return null;
}

function parseQuantityInGrams(text: string): number | null {
  const gMatch = text.match(/(\d+(?:[.,]\d+)?)\s*g\b/i);
  if (gMatch) return Number(gMatch[1].replace(',', '.'));

  const kgMatch = text.match(/(\d+(?:[.,]\d+)?)\s*kg\b/i);
  if (kgMatch) return Number(kgMatch[1].replace(',', '.')) * 1000;

  const mlMatch = text.match(/(\d+(?:[.,]\d+)?)\s*ml\b/i);
  if (mlMatch) return Number(mlMatch[1].replace(',', '.'));

  const lMatch = text.match(/(\d+(?:[.,]\d+)?)\s*l\b/i);
  if (lMatch) return Number(lMatch[1].replace(',', '.')) * 1000;

  return null;
}

export function estimateCaloriesFromIngredients(ingredients: string): number {
  const lines = ingredients
    .split(/\n|,|;/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let total = 0;

  for (const line of lines) {
    const kcalPer100g = findKcalPer100g(line);
    if (!kcalPer100g) continue;

    const grams = parseQuantityInGrams(line) ?? 100;
    total += (grams / 100) * kcalPer100g;
  }

  // Fallback if no ingredient matched.
  if (total <= 0) return 300;

  return Math.max(50, Math.round(total));
}
