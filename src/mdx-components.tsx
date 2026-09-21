import type { MDXComponents } from "mdx/types";

// Prose styles for every content/work/*/index.mdx. Figures come in per page (they need that project's media).
const components: MDXComponents = {
  h2: (props) => <h2 className="clear-both mt-16 border-t-[1.5px] border-ink pt-4 text-3xl font-extrabold tracking-[-0.02em] [font-stretch:108%]" {...props} />,
  h3: (props) => <h3 className="mt-10 text-xl font-bold" {...props} />,
  p: (props) => <p className="mt-5 max-w-[65ch] text-lg leading-relaxed" {...props} />,
  ul: (props) => <ul className="mt-5 max-w-[65ch] list-disc space-y-2 pl-5 text-lg leading-relaxed marker:text-ink-2" {...props} />,
  ol: (props) => <ol className="mt-5 max-w-[65ch] list-decimal space-y-2 pl-5 text-lg leading-relaxed" {...props} />,
  a: (props) => <a className="underline hover:text-stamp" {...props} />,
  strong: (props) => <strong className="font-bold" {...props} />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
