import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || "https://ftuwtquthxvylfuqahgs.supabase.co";
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "sb_publishable_qe6Auf6KzCAX3dDlwm41iA_amnfNy7u";

export const supabase = createClient(supabaseUrl, supabaseKey);

export type WardrobeItem = {
  id: string;
  created_at: string;
  name: string;
  category: string;
  color: string | null;
  color_hex: string | null;
  occasion_tags: string[] | null;
  weather_tags: string[] | null;
  image_url: string;
  notes: string | null;
};

export type UserProfile = {
  id: string;
  skin_tone_hex: string | null;
  skin_tone_label: string | null;
};
