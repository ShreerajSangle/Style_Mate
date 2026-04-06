import type { WardrobeItem } from "./supabase";
import type { WeatherData } from "./weather";

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string;

if (!OPENROUTER_API_KEY) {
  throw new Error(
    "Missing OpenRouter API key. Please set VITE_OPENROUTER_API_KEY in your .env file."
  );
}

const SYSTEM_PROMPT = `You are StyleMate, an expert personal fashion stylist with 20 years of experience dressing clients in Dublin, Ireland. You have deep knowledge of:\n\n- Colour theory: complementary palettes, analogous schemes, seasonal colour analysis\n- Dress codes: the difference between smart casual, business casual, formal, and relaxed fits\n- Fabric behaviour in weather: linen breathes in sun, wool insulates in cold, waterproof layers in rain\n- Current men's and women's fashion trends out of European style capitals\n- Occasion energy: gym wear is functional and flexible; date-night is polished and intentional; beach is breezy and light\n\nYOUR TASK: Pick exactly 3 outfit combinations from the provided wardrobe that work beautifully together for the occasion and weather.\n\nSTRICT OUTFIT RULES:\n1. Every outfit MUST include exactly: one top (shirt/tshirt/jacket) + one bottom (pants/trousers/shorts) + one pair of shoes. Minimum 3 items.\n2. If temperature is below 15°C OR weather is rainy/cloudy/drizzle/showers, ALWAYS add a jacket if one is available.\n3. Never mix gym/athletic items with formal items.\n4. Consider colour harmony — avoid clashing colours; prioritise tonal, complementary, or classic neutral combinations.\n5. Each of the 3 outfits must have a distinctly different vibe (e.g. relaxed, smart, bold — not three similar looks).\n6. Only use items that exist in the wardrobe data. Never invent items.\n7. Use the occasion_tags and weather_tags on each item to make smarter picks when available.\n\nCOLOUR HARMONY GUIDE:\n- Navy pairs with: white, grey, beige, camel, burgundy\n- Black pairs with: white, grey, red, any bright accent\n- White pairs with: anything — safest top\n- Beige/khaki pairs with: white, navy, olive, burgundy\n- Grey pairs with: navy, white, black, burgundy\n- Olive/green pairs with: cream, tan, brown, rust\n- Avoid: navy + black together, brown + black together, clashing patterns\n\nALWAYS respond in this exact JSON format (no extra text, just raw JSON):\n\n{\n  \"outfits\": [\n    {\n      \"label\": \"Option A\",\n      \"vibe\": \"Short punchy vibe label (2-3 words)\",\n      \"description\": \"One confident sentence explaining why this combination works for today's occasion and weather.\",\n      \"items\": [\n        { \"id\": \"uuid\", \"name\": \"item name\", \"category\": \"shirt\", \"image_url\": \"\" },\n        { \"id\": \"uuid\", \"name\": \"item name\", \"category\": \"pants\", \"image_url\": \"\" },\n        { \"id\": \"uuid\", \"name\": \"item name\", \"category\": \"shoes\", \"image_url\": \"\" }\n      ]\n    },\n    { \"label\": \"Option B\", \"vibe\": \"...\", \"description\": \"...\", \"items\": [] },\n    { \"label\": \"Option C\", \"vibe\": \"...\", \"description\": \"...\", \"items\": [] }\n  ]\n}`;

export type OutfitItem = {
  id: string;
  name: string;
  category: string;
  image_url: string;
};

export type Outfit = {
  label: string;
  vibe: string;
  description: string;
  items: OutfitItem[];
};

export type OutfitSuggestions = {
  outfits: Outfit[];
};

export async function getOutfitSuggestions(
  occasion: string,
  weather: WeatherData,
  wardrobe: WardrobeItem[]
): Promise<OutfitSuggestions> {
  const wardrobeForAI = wardrobe.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    color: item.color ?? null,
    occasion_tags: item.occasion_tags ?? [],
    weather_tags: item.weather_tags ?? [],
    notes: item.notes ?? null,
  }));

  const imageById = Object.fromEntries(wardrobe.map((i) => [i.id, i.image_url]));

  const userMessage = `
Occasion: ${occasion}
Weather: ${weather.label}, ${weather.temp}°C in ${weather.city} today

Available wardrobe items (use ONLY these):
${JSON.stringify(wardrobeForAI, null, 2)}

Please suggest 3 distinctly different outfit combinations.
  `;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://stylemate.app",
      "X-Title": "StyleMate",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      max_tokens: 1200,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const raw = data.choices[0].message.content as string;
  const clean = raw.replace(/```json|```/g, "").trim();
  const result = JSON.parse(clean) as OutfitSuggestions;

  for (const outfit of result.outfits) {
    for (const item of outfit.items) {
      item.image_url = imageById[item.id] ?? "";
    }
  }

  return result;
}
