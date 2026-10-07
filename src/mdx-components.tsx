import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";
import { anchor } from "@/lib/anchor";

// Section headings carry an id from their text, so the section index and a shared link can jump straight to them.
const slug = (c: ReactNode) => (typeof c === "string" ? anchor(c) : undefined);

// A section heading, tagged so the write-up can be grouped into sections (components/case-body.tsx).
const H2 = Object.assign(
  (props: React.ComponentProps<"h2">) => <h2 id={slug(props.children)} className="display clear-both mt-16 scroll-mt-20 border-t border-rule pt-6" {...props} />, // size: console.css
  { kind: "h2" as const },
);

// Prose styles for every content/work/*/index.mdx. Figures come in per page (they need that project's media).
const components: MDXComponents = {
  h2: H2,
  h3: (props) => <h3 className="mt-10 text-xl font-semibold" {...props} />,
  p: (props) => <p className="mt-5 max-w-[42rem] text-lg leading-relaxed" {...props} />,
  ul: (props) => <ul className="mt-5 max-w-[42rem] list-disc space-y-2 pl-5 text-lg leading-relaxed marker:text-accent" {...props} />,
  ol: (props) => <ol className="mt-5 max-w-[42rem] list-decimal space-y-2 pl-5 text-lg leading-relaxed marker:text-accent" {...props} />,
  a: (props) => <a className="link" {...props} />,
  strong: (props) => <strong className="font-semibold" {...props} />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
