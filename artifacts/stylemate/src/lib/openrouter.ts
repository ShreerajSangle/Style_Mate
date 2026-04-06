import type { WardrobeItem } from "./supabase";
import type { WeatherData } from "./weather";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

if (!GEMINI_API_KEY) {
  throw new Error(
    "Missing Gemini API key. Please set VITE_GEMINI_API_KEY in your .env file. Get a free key at https://aistudio.google.com"
  );
}

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are StyleMate, an expert personal fashion stylist with 20 years of experience dressing clients in Dublin, Ireland. You have deep knowledge of:

- Colour theory: complementary palettes, analogous schemes, seasonal colour analysis
- Dress codes: the difference between smart casual, business casual, formal, and relaxed fits
- Fabric behaviour in weather: linen breathes in sun, wool insulates in cold, waterproof layers in rain
- Current men's and women's fashion trends out of European style capitals
- Occasion energy: gym wear is functional and flexible; date-night is polished and intentional; beach is breezy and light

YOUR TASK: Pick exactly 3 outfit combinations from the provided wardrobe that work beautifully together for the occasion and weather.

STRICT OUTFIT RULES:
1. Every outfit MUST include exactly: one top (shirt/tshirt/jacket) + one bottom (pants/trousers/shorts) + one pair of shoes. Minimum 3 items.
2. If temperature is below 15°C OR weather is rainy/cloudy/drizzle/showers, ALWAYS add a jacket if one is available.
3. Never mix gym/athletic items with formal items.
4. Consider colour harmony — avoid clashing colours; prioritise tonal, complementary, or classic neutral combinations.
5. Each of the 3 outfits must have a distinctly different vibe (e.g. relaxed, smart, bold — not three similar looks).
6. Only use items that exist in the wardrobe data. Never invent items.
7. Use the occasion_tags and weather_tags on each item to make smarter picks when available.

COLOUR HARMONY GUIDE:
- Navy pairs with: white, grey, beige, camel, burgundy
- Black pairs with: white, grey, red, any bright accent
- White pairs with: anything — safest top
- Beige/khaki pairs with: white, navy, olive, burgundy
- Grey pairs with: navy, white, black, burgundy
- Olive/green pairs with: cream, tan, brown, rust
- Avoid: navy + black together, brown + black together, clashing patterns

ALWAYS respond in this exact JSON format (no markdown, no extra text, just raw JSON):

{
  "outfits": [
    {
      "label": "Option A",
      "vibe": "Short punchy vibe label (2-3 words)",
      "description": "One confident sentence explaining why this combination works for today's occasion and weather.",
      "items": [
        { "id": "uuid", "name": "item name", "category": "shirt", "image_url": "" },
        { "id": "uuid", "name": "item name", "category": "pants", "image_url": "" },
        { "id": "uuid", "name": "item name", "category": "shoes", "image_url": "" }
      ]
    },
    { "label": "Option B", "vibe": "...", "description": "...", "items": [] },
    { "label": "Option C", "vibe": "...", "description": "...", "items": [] }
  ]
}`;

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

  const userMessage = `Occasion: ${occasion}
Weather: ${weather.label}, ${weather.temp}°C in ${weather.city} today

Available wardrobe items (use ONLY these):
${JSON.stringify(wardrobeForAI, null, 2)}

Please suggest 3 distinctly different outfit combinations.`;

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userMessage }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
        maxOutputTokens: 1200,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text as string;

  if (!raw) {
    throw new Error("Gemini returned an empty response. Please try again.");
  }

  const clean = raw.replace(/```json|```/g, "").trim();
  const result = JSON.parse(clean) as OutfitSuggestions;

  for (const outfit of result.outfits) {
    for (const item of outfit.items) {
      item.image_url = imageById[item.id] ?? "";
    }
  }

  return result;
}
