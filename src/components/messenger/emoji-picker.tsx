"use client";

const EMOJI_CATEGORIES = [
  { name: "Частые", emojis: ["😀", "😂", "😍", "🥰", "😎", "🤔", "😅", "👍", "❤️", "🔥", "✨", "🎉"] },
  { name: "Жесты", emojis: ["👋", "🤝", "👏", "🙌", "💪", "✌️", "🤙", "👊", "🫡", "🙏"] },
  { name: "Животные", emojis: ["🐶", "🐱", "🐻", "🦊", "🐼", "🐨", "🦁", "🐸", "🐰", "🐻‍❄️"] },
  { name: "Еда", emojis: ["🍕", "🍔", "🍟", "🌮", "🍣", "🍰", "☕", "🍺", "🍷", "🥤"] },
  { name: "Объекты", emojis: ["💻", "📱", "💡", "🎯", "🚀", "⭐", "🎵", "📝", "🔑", "💎"] },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  return (
    <div className="absolute bottom-full right-0 mb-2 w-72 rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-xl z-50">
      <div className="max-h-60 overflow-y-auto p-2">
        {EMOJI_CATEGORIES.map((cat) => (
          <div key={cat.name} className="mb-2">
            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              {cat.name}
            </p>
            <div className="grid grid-cols-6 gap-0.5">
              {cat.emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => { onSelect(emoji); onClose(); }}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-lg hover:bg-[var(--surface)] transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
