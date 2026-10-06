import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, ArrowLeft } from "lucide-react";

const LOGOS = [
  { id: 1, file: "/logos/logo-01.png", name: "Original", desc: "Your current favicon.svg" },
  { id: 2, file: "/logos/logo-02.jpg", name: "Neon Mint", desc: "Brighter mint glass X" },
  { id: 3, file: "/logos/logo-03.jpg", name: "Violet Glass", desc: "Purple crystal X" },
  { id: 4, file: "/logos/logo-04.jpg", name: "Cyan Crystal", desc: "Aqua glass X" },
  { id: 5, file: "/logos/logo-05.jpg", name: "Dark Mode", desc: "Mint X on dark card" },
  { id: 6, file: "/logos/logo-06.jpg", name: "Emerald Gold", desc: "Green + warm accents" },
  { id: 7, file: "/logos/logo-07.jpg", name: "Bold Slash", desc: "Stronger diagonal cut" },
  { id: 8, file: "/logos/logo-08.jpg", name: "Soft Mint BG", desc: "Light mint backdrop" },
  { id: 9, file: "/logos/logo-09.jpg", name: "Teal Classic", desc: "Cool teal glass X" },
  { id: 10, file: "/logos/logo-10.jpg", name: "Dual Tone", desc: "Mint X + violet slash" },
];

function Logos() {
  const [selected, setSelected] = useState(1);
  const [copied, setCopied] = useState(false);
  const active = LOGOS.find((l) => l.id === selected) || LOGOS[0];

  const copyChoice = async () => {
    const text = `Logo #${active.id} — ${active.name} (${active.file})`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-primaryBg text-textPrimary px-4 py-8 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-textMuted hover:text-textPrimary transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <p className="text-xs text-textMuted">Pick an install / launch icon</p>
        </div>

        <h1
          className="text-2xl sm:text-3xl font-extrabold mb-2"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          App Logo Options
        </h1>
        <p className="text-sm text-textMuted mb-8 max-w-2xl">
          Same style as your current <span className="text-accent">favicon.svg</span> — 3D glass X + FahadTradeX.
          Tap one, then reply with the number (e.g. <span className="text-accent">#3</span>).
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
          {LOGOS.map((logo) => {
            const isActive = selected === logo.id;
            return (
              <button
                key={logo.id}
                type="button"
                onClick={() => setSelected(logo.id)}
                className={`relative rounded-2xl border p-3 sm:p-4 text-left transition-all ${
                  isActive
                    ? "border-[#7c6fff] bg-[rgba(124,111,255,0.12)] shadow-[0_0_0_1px_rgba(124,111,255,0.35)]"
                    : "border-borderColor bg-cardBg hover:border-[rgba(124,111,255,0.35)]"
                }`}
              >
                {isActive && (
                  <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-[#7c6fff] text-white flex items-center justify-center">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
                <div className="aspect-square rounded-xl overflow-hidden bg-white flex items-center justify-center mb-3">
                  <img
                    src={logo.file}
                    alt={logo.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-[11px] font-bold text-accent mb-0.5">#{logo.id}</p>
                <p className="text-sm font-semibold truncate">{logo.name}</p>
                <p className="text-[11px] text-textMuted mt-0.5 line-clamp-2">{logo.desc}</p>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-borderColor bg-cardBg p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-5">
          <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-[28px] bg-white border border-borderColor flex items-center justify-center shrink-0 overflow-hidden shadow-lg">
            <img src={active.file} alt={active.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 text-center sm:text-left min-w-0">
            <p className="text-xs uppercase tracking-[0.14em] text-textMuted mb-1">Selected</p>
            <p className="text-xl font-extrabold" style={{ fontFamily: "'Syne', sans-serif" }}>
              #{active.id} — {active.name}
            </p>
            <p className="text-sm text-textMuted mt-1">{active.desc}</p>
            <p className="text-xs text-textSubtle mt-2 font-mono truncate">{active.file}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={copyChoice}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-borderColor hover:bg-[var(--color-row-hover)] transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy selection"}
              </button>
              <p className="text-xs text-textMuted">
                Reply with <span className="text-accent font-semibold">#{active.id}</span> to apply it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Logos;
