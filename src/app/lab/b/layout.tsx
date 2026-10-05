import { Martian_Mono } from "next/font/google";

// One Martian Mono for the console and its project files.
const martian = Martian_Mono({ subsets: ["latin"], axes: ["wdth"], variable: "--lc-mono" });

export default function ConsoleLayout({ children }: LayoutProps<"/lab/b">) {
  return <div className={martian.variable}>{children}</div>;
}
