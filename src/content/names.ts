// Children's names made ahead of time in the guide's voice (no live AI, no names sent anywhere at play time).
// plain = the nickname as typed (no nikud); id = file-safe id (public/audio/name-<id>.mp3); text = with nikud.
// A parent's own recording (parents' area) always wins over this list.

export const NAMES: { plain: string; id: string; text: string }[] = [
  { plain: "עוז", id: "oz", text: "עוֹז" },
  { plain: "עדן", id: "eden", text: "עֵדֶן" },
];

const strip = (s: string) => s.replace(/[֑-ׇ]/g, "").replace(/[^א-ת]/g, "");

/** Voice-line id for this nickname, if we have it ready-made. */
export function nameLineId(nickname: string): string | undefined {
  const n = NAMES.find((x) => x.plain === strip(nickname));
  return n ? `name-${n.id}` : undefined;
}
