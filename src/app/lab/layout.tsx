import type { Metadata } from "next";
import "./lab.css";

// Direction prototypes for v5. Each lab page is its own full-screen experience, so the current site's header and
// footer step aside here, and search engines are kept out.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{"body>header,body>footer{display:none!important}body{background:#0d0d0c}"}</style>
      {children}
    </>
  );
}
