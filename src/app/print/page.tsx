import { Suspense } from "react";
import { WorksheetBuilder } from "./WorksheetBuilder";

/** 📄 Worksheets for parents (letters, nikud, reading): pick, preview, print or save as PDF. */
export default function PrintIndexPage() {
  return (
    <Suspense fallback={null}>
      <WorksheetBuilder />
    </Suspense>
  );
}
