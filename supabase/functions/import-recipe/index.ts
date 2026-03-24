import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import * as cheerio from 'npm:cheerio@1.2.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DraftIngredient {
  id: string;
  recipeId: string;
  title: string;
  note: string | null;
  quantity: number | null;
  unit: string | null;
  category: string;
  catalogItemId: string | null;
  optional: boolean;
  sortOrder: number;
}

interface RecipeImportDraft {
  sourceUrl: string;
  sourceLabel: string | null;
  title: string;
  summary: string | null;
  servings: number | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  totalMinutes: number | null;
  imageUrl: string | null;
  ingredients: DraftIngredient[];
  instructions: string[];
  tags: string[];
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const match = value.match(/(\d+(\.\d+)?)/);
    return match ? Number(match[1]) : null;
  }
  return null;
}

function toMinutes(value: unknown): number | null {
  if (typeof value !== 'string') return toNumber(value);
  const minute = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!minute) return toNumber(value);
  return (Number(minute[1] ?? 0) * 60) + Number(minute[2] ?? 0);
}

function normalizeArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function coerceText(value: unknown): string | null {
  if (typeof value === 'string') return value.trim();
  return null;
}

function ingredientFromText(text: string, index: number): DraftIngredient {
  return {
    id: `import-${index}`,
    recipeId: 'draft',
    title: text.trim(),
    note: null,
    quantity: null,
    unit: null,
    category: 'other',
    catalogItemId: null,
    optional: false,
    sortOrder: index,
  };
}

function extractRecipeJsonLd(html: string): Record<string, unknown> | null {
  const $ = cheerio.load(html);
  for (const script of $('script[type="application/ld+json"]').toArray()) {
    const raw = $(script).contents().text();
    try {
      const parsed = JSON.parse(raw);
      const nodes = normalizeArray(parsed).flatMap((value) =>
        typeof value === 'object' && value && '@graph' in value
          ? normalizeArray((value as Record<string, unknown>)['@graph'] as Record<string, unknown>[])
          : [value]
      );
      const recipe = nodes.find((node) => {
        const candidate = node as Record<string, unknown>;
        const type = normalizeArray(candidate['@type']);
        return type.includes('Recipe');
      });
      if (recipe) return recipe as Record<string, unknown>;
    } catch {
      // Ignore malformed JSON-LD blocks
    }
  }
  return null;
}

function htmlToRecipeDraft(sourceUrl: string, html: string): RecipeImportDraft {
  const $ = cheerio.load(html);
  const jsonLd = extractRecipeJsonLd(html);
  const ingredientTexts = jsonLd
    ? normalizeArray(jsonLd.recipeIngredient as string[])
    : $('[itemprop="recipeIngredient"], .ingredient, .ingredients li')
        .toArray()
        .map((node) => $(node).text().trim())
        .filter(Boolean);
  const instructionTexts = jsonLd
    ? normalizeArray(jsonLd.recipeInstructions as Array<string | Record<string, unknown>>)
        .flatMap((step) => {
          if (typeof step === 'string') return [step.trim()];
          const text = coerceText((step as Record<string, unknown>).text);
          return text ? [text] : [];
        })
    : $('[itemprop="recipeInstructions"], .instruction, .instructions li')
        .toArray()
        .map((node) => $(node).text().trim())
        .filter(Boolean);

  return {
    sourceUrl,
    sourceLabel: coerceText((jsonLd?.author as Record<string, unknown> | undefined)?.name) ?? $('meta[property="og:site_name"]').attr('content') ?? new URL(sourceUrl).hostname,
    title: coerceText(jsonLd?.name) ?? $('meta[property="og:title"]').attr('content') ?? $('title').text().trim() ?? 'Imported recipe',
    summary: coerceText(jsonLd?.description) ?? $('meta[name="description"]').attr('content') ?? null,
    servings: toNumber(jsonLd?.recipeYield),
    prepMinutes: toMinutes(jsonLd?.prepTime),
    cookMinutes: toMinutes(jsonLd?.cookTime),
    totalMinutes: toMinutes(jsonLd?.totalTime),
    imageUrl:
      coerceText(jsonLd?.image) ??
      normalizeArray(jsonLd?.image as string[])[0] ??
      $('meta[property="og:image"]').attr('content') ??
      null,
    ingredients: ingredientTexts.map((text, index) => ingredientFromText(text, index)),
    instructions: instructionTexts,
    tags: normalizeArray(jsonLd?.keywords as string[]).flatMap((value) => value.split(',').map((part) => part.trim()).filter(Boolean)),
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { source_url } = await req.json() as { source_url: string };
    if (!source_url) {
      return new Response(JSON.stringify({ error: 'source_url is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(source_url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JollyHomeRecipeImporter/1.0)' },
    });
    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch recipe URL' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const html = await response.text();
    const draft = htmlToRecipeDraft(source_url, html);

    return new Response(JSON.stringify(draft), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unexpected import failure' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
