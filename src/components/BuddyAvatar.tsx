import { ACCESSORY_BY_ID, BUDDY_BY_ID } from "@/content/buddies";

/** The buddy with what it wears. Emoji layers: head items above, face items over, hand items to the side. */
export function BuddyAvatar({ buddy, wearing = [], size = 64 }: { buddy: string; wearing?: string[]; size?: number }) {
  const b = BUDDY_BY_ID[buddy];
  if (!b) return null;
  const items = wearing.map((id) => ACCESSORY_BY_ID[id]).filter(Boolean);
  return (
    <span className="relative inline-flex items-center justify-center leading-none" style={{ width: size, height: size }} aria-hidden>
      <span style={{ fontSize: size * 0.82 }}>{b.emoji}</span>
      {items.map((a) => (
        <span
          key={a.id}
          className="absolute"
          style={
            a.spot === "head"
              ? { top: -size * 0.3, fontSize: size * 0.45 }
              : a.spot === "face"
                ? { top: size * 0.22, fontSize: size * 0.4 }
                : { bottom: 0, left: -size * 0.22, fontSize: size * 0.4 }
          }
        >
          {a.emoji}
        </span>
      ))}
    </span>
  );
}
