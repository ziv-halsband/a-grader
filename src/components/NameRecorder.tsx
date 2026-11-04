"use client";

import { useEffect, useRef, useState } from "react";
import { readNameRecording, saveNameRecording } from "@/lib/nameRecording";

/** Parents' area: record the child's name once (so the guide can greet "בֹּקֶר טוֹב, נוֹעָה!"). */
export function NameRecorder({ childId, nickname }: { childId: string; nickname: string }) {
  const [url, setUrl] = useState<string | undefined>();
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser storage after mount
    setUrl(readNameRecording(childId));
  }, [childId]);

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const reader = new FileReader();
        reader.onload = () => {
          const data = reader.result as string;
          saveNameRecording(childId, data);
          setUrl(data);
        };
        reader.readAsDataURL(new Blob(chunks, { type: r.mimeType }));
      };
      rec.current = r;
      r.start();
      setRecording(true);
      // Safety stop: a name takes a second or two.
      setTimeout(() => r.state === "recording" && r.stop(), 4000);
      r.addEventListener("stop", () => setRecording(false));
    } catch {
      setError("אין גישה למיקרופון. אפשר לאשר גישה בהגדרות הדפדפן.");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="w-24 text-sm">השם בקול</span>
      {recording ? (
        <button onClick={() => rec.current?.stop()} className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white">
          ⏹ עצירה
        </button>
      ) : (
        <button onClick={start} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold">
          🔴 {url ? "הקלטה מחדש" : `הקליטו את השם "${nickname}"`}
        </button>
      )}
      {url && !recording && (
        <>
          <button onClick={() => new Audio(url).play()} className="rounded-full bg-slate-100 px-4 py-2 text-sm">
            ▶️ השמעה
          </button>
          <button
            onClick={() => {
              saveNameRecording(childId, null);
              setUrl(undefined);
            }}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm"
          >
            מחיקה
          </button>
        </>
      )}
      <span className="w-full text-xs text-slate-500">
        המורה תפנה לילד/ה בשם בברכת הבוקר. ההקלטה נשמרת רק במכשיר הזה ולא נשלחת לשום מקום.
      </span>
      {error && <span className="w-full text-xs text-red-600">{error}</span>}
    </div>
  );
}
