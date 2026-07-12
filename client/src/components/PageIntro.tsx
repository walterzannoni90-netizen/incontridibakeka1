import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export default function PageIntro({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  children?: ReactNode;
}) {
  return (
    <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950 via-violet-800 to-fuchsia-700 px-5 py-7 text-white shadow-xl shadow-violet-950/15 md:px-9 md:py-10">
      <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-fuchsia-300/20 blur-3xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-cyan-200">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 backdrop-blur-sm"><Icon className="h-4 w-4" /></span>
            {eyebrow}
          </div>
          <h1 className="font-poppins text-3xl font-bold leading-tight md:text-5xl">{title}</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75 md:text-base">{description}</p>
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>
    </section>
  );
}

