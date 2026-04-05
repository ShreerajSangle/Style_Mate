import type { WardrobeItem } from "./supabase";
import type { WeatherData } from "./weather";

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string;

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

COLOUR HARMONY GUIDE (use this when picking combinations):
- Navy pairs with: white, grey, beige, camel, burgundy
- Black pairs with: white, grey, red, any bright accent
- White pairs with: anything — safest top
- Beige/khaki pairs with: white, navy, olive, burgundy
- Grey pairs with: navy, white, black, burgundy
- Olive/green pairs with: cream, tan, brown, rust
- Avoid: navy + black together, brown + black together, clashing patterns

ALWAYS respond in this exact JSON format (no extra text, just raw JSON):

{
  "outfits": [
    {
      "label": "Option A",
      "vibe": "Short punchy vibe label (2-3 words)",
      "description": "One confident sentence explaining why this combination works for today's occasion and weather. Mention the specific colours and why they work together.",
      "items": [
        { "id": "uuid", "name": "item name", "category": "shirt", "image_url": "https://..." },
        { "id": "uuid", "name": "item name", "category": "pants", "image_url": "https://..." },
        { "id": "uuid", "name": "item name", "category": "shoes", "image_url": "https://..." }
      ]
    },
    {
      "label": "Option B",
      "vibe": "...",
      "description": "...",
      "items": [...]
    },
    {
      "label": "Option C",
      "vibe": "...",
      "description": "...",
      "items": [...]
    }
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
  wardrobe: WardrobeItem[],
  skinTone: string
): Promise<OutfitSuggestions> {
  // Build a lightweight wardrobe list for the AI — no base64 images
  const wardrobeForAI = wardrobe.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    color: item.color ?? null,
    occasion_tags: item.occasion_tags ?? [],
    weather_tags: item.weather_tags ?? [],
  }));

  // Keep a quick lookup so we can hydrate image_url after the AI responds
  const imageById = Object.fromEntries(wardrobe.map((i) => [i.id, i.image_url]));

  const userMessage = `
Occasion: ${occasion}
Weather: ${weather.label}, ${weather.temp}°C in Dublin today
User skin tone: ${skinTone}

Available wardrobe items (use ONLY these):
${JSON.stringify(wardrobeForAI, null, 2)}

Please suggest 3 distinctly different outfit combinations that look great together.
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
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("OpenRouter response:", response.status, err);
    throw new Error(`OpenRouter error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const raw = data.choices[0].message.content as string;
  const clean = raw.replace(/```json|```/g, "").trim();
  const result = JSON.parse(clean) as OutfitSuggestions;

  // Hydrate image_url from the local wardrobe lookup (AI payload had no images)
  for (const outfit of result.outfits) {
    for (const item of outfit.items) {
      item.image_url = imageById[item.id] ?? item.image_url ?? "";
    }
  }

  return result;
}
