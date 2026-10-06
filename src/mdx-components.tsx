import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";
import { anchor } from "@/lib/anchor";

// Section headings carry an id from their text, so the section index and a shared link can jump straight to them.
const slug = (c: ReactNode) => (typeof c === "string" ? anchor(c) : undefined);

// Prose styles for every content/work/*/index.mdx. Figures come in per page (they need that project's media).
const components: MDXComponents = {
  h2: (props) => <h2 id={slug(props.children)} className="display clear-both mt-24 scroll-mt-20 border-t border-rule pt-6" {...props} />, // size: console.css
  h3: (props) => <h3 className="mt-10 text-xl font-semibold" {...props} />,
  p: (props) => <p className="mt-5 max-w-[65ch] text-lg leading-relaxed" {...props} />,
  ul: (props) => <ul className="mt-5 max-w-[65ch] list-disc space-y-2 pl-5 text-lg leading-relaxed marker:text-accent" {...props} />,
  ol: (props) => <ol className="mt-5 max-w-[65ch] list-decimal space-y-2 pl-5 text-lg leading-relaxed marker:text-accent" {...props} />,
  a: (props) => <a className="link" {...props} />,
  strong: (props) => <strong className="font-semibold" {...props} />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
