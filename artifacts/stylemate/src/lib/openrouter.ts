import type { WardrobeItem } from "./supabase";
import type { WeatherData } from "./weather";

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string;

const SYSTEM_PROMPT = `You are StyleMate, a personal fashion stylist AI for a user in Dublin, Ireland.

Your only job is to pick 3 outfit combinations from the user's wardrobe based on the occasion and current weather provided.

RULES:
- Every outfit MUST include: one top (shirt/tshirt/jacket) + one bottom (pants/trousers/shorts) + shoes
- Add a jacket if temp is below 15°C or it is rainy/cloudy
- Match the energy of the occasion — don't suggest formal trousers for gym
- Consider colour harmony with the user's skin tone

ALWAYS respond in this exact JSON format (no extra text, just the JSON):

{
  "outfits": [
    {
      "label": "Option A",
      "vibe": "Short vibe label e.g. Relaxed Cool",
      "description": "One sentence why this works for today.",
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
}

Only use items from the wardrobe data provided. Never invent items.`;

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
  const userMessage = `
Occasion: ${occasion}
Weather: ${weather.label}, ${weather.temp}°C in Dublin
User skin tone: ${skinTone}

Wardrobe:
${JSON.stringify(wardrobe, null, 2)}

Please suggest 3 outfits.
  `;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://stylemate.app",
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
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  const raw = data.choices[0].message.content as string;
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean) as OutfitSuggestions;
}
