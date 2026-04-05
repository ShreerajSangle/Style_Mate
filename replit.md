# StyleMate — AI Outfit Helper

## Overview

A personal AI outfit picker web app for Dublin. The user selects an occasion, Dublin weather is auto-loaded, and the AI (Claude 3.5 Sonnet via OpenRouter) suggests 3 complete outfit combinations from the user's wardrobe stored in Supabase.

## Stack

- **Frontend**: React + Vite (artifact: `stylemate`, preview at `/`)
- **Styling**: Tailwind CSS + custom dark luxury CSS (Playfair Display + DM Sans fonts)
- **AI**: OpenRouter API — model: `anthropic/claude-3.5-sonnet`
- **Database**: Supabase (PostgreSQL + Storage for clothing images)
- **Weather**: Open-Meteo API (free, no key — Dublin lat=53.3498, lon=-6.2603)
- **Monorepo**: pnpm workspaces

## Key Files

- `artifacts/stylemate/src/App.tsx` — main app router + nav
- `artifacts/stylemate/src/pages/Home.tsx` — outfit picker screen
- `artifacts/stylemate/src/pages/Wardrobe.tsx` — wardrobe manager screen
- `artifacts/stylemate/src/lib/supabase.ts` — Supabase client + types
- `artifacts/stylemate/src/lib/openrouter.ts` — AI API call + system prompt
- `artifacts/stylemate/src/lib/weather.ts` — Open-Meteo weather fetch
- `artifacts/stylemate/src/components/` — all UI components
- `artifacts/stylemate/src/index.css` — dark luxury design system

## Environment Variables

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/publishable key
- `VITE_OPENROUTER_API_KEY` — OpenRouter API key

## Supabase Schema

- `wardrobe` table: id, name, category, color, color_hex, occasion_tags[], weather_tags[], image_url, notes
- `user_profile` table: id, skin_tone_hex, skin_tone_label
- Storage bucket: `wardrobe-images` (public)

## Features

- **Screen 1 — Outfit Picker**: Occasion chip selector, live Dublin weather widget, AI suggests 3 outfit options with animated cards
- **Screen 2 — Wardrobe Manager**: Photo grid with category filters, add item modal (photo upload → Supabase storage), delete with confirmation

## Commands

- `pnpm --filter @workspace/stylemate run dev` — run dev server
- `pnpm --filter @workspace/stylemate run build` — production build

## Node.js version: 24
## Package manager: pnpm
