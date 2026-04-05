import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

const SQL = `-- Run this once in your Supabase SQL Editor
create table if not exists public.wardrobe (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  name text not null,
  category text not null,
  color text,
  color_hex text,
  occasion_tags text[],
  weather_tags text[],
  image_url text not null,
  notes text
);

-- Allow public read/write access
alter table public.wardrobe enable row level security;

create policy "Public access"
  on public.wardrobe
  for all
  using (true)
  with check (true);`.trim();

const PROJECT_REF = "ftuwtquthxvylfuqahgs";
const SQL_EDITOR_URL = `https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`;

export function DatabaseSetup({ onDone }: { onDone: () => void }) {
  const [copied, setCopied] = useState(false);

  function copySQL() {
    navigator.clipboard.writeText(SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="modal-panel w-full max-w-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center text-gold text-lg font-serif">!</div>
          <h2 className="text-xl font-serif text-white">One-time database setup</h2>
        </div>
        <p className="text-white/50 text-sm mb-5 ml-12">
          The <span className="text-white/80 font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">wardrobe</span> table doesn't exist yet in your Supabase project. Run this SQL once to create it.
        </p>

        {/* SQL block */}
        <div className="relative mb-5">
          <pre className="bg-black/50 border border-white/10 rounded-xl p-4 text-xs text-white/70 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">{SQL}</pre>
          <button
            onClick={copySQL}
            className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              copied
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-white/8 text-white/60 border border-white/10 hover:bg-white/12 hover:text-white"
            }`}
          >
            {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy SQL</>}
          </button>
        </div>

        {/* Steps */}
        <ol className="space-y-2 mb-6 text-sm text-white/60">
          <li className="flex gap-2">
            <span className="text-gold font-bold shrink-0">1.</span>
            <span>Click <strong className="text-white/80">Copy SQL</strong> above, then open the Supabase SQL Editor</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gold font-bold shrink-0">2.</span>
            <span>Paste and click <strong className="text-white/80">Run</strong> — takes about 2 seconds</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gold font-bold shrink-0">3.</span>
            <span>Come back here and click <strong className="text-white/80">Done, it's set up</strong></span>
          </li>
        </ol>

        <div className="flex gap-3">
          <a
            href={SQL_EDITOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex-1 flex items-center justify-center gap-2"
          >
            <ExternalLink size={14} />
            Open SQL Editor
          </a>
          <button onClick={onDone} className="btn-primary flex-1">
            Done, it's set up
          </button>
        </div>
      </div>
    </div>
  );
}
