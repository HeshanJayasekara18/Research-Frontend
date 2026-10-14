// Small presentational building blocks shared by the dashboard sections (dashboard-scoped).

import Image from "next/image";

import { Icon, type IconName } from "@/components/shell/Icon";
import { cn } from "@/components/ui/styles";

/** Dashboard card surface: minimal border, soft shadow, uses the app's theme tokens. */
export const PANEL = "rounded-[20px] border border-separator bg-surface shadow-soft";

/** Subtle entrance; disabled automatically by the global prefers-reduced-motion rule. */
export const ENTER = "animate-[dash-enter_320ms_cubic-bezier(0.22,1,0.36,1)_both]";

export function SectionHeader({
  id,
  title,
  description,
  action,
}: {
  id: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 id={id} className="text-[1.08rem] font-semibold tracking-[-0.01em]">
          {title}
        </h2>
        {description && <p className="m-0 mt-0.5 text-[0.84rem] text-label-3">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyNote({ icon, title, children }: { icon: IconName; title: string; children?: React.ReactNode }) {
  return (
    <div className="grid justify-items-start gap-1.5 rounded-2xl border border-dashed border-separator p-4">
      <span className="grid size-8 place-items-center rounded-[10px] bg-fill text-label-3" aria-hidden>
        <Icon name={icon} size={16} />
      </span>
      <p className="m-0 text-[0.9rem] font-semibold">{title}</p>
      {children && <div className="text-[0.82rem] text-label-3">{children}</div>}
    </div>
  );
}

const PLACEHOLDER_TONES = {
  indigo: "from-[#4f5bd5]/35 via-[#8e6cf0]/20 to-transparent",
  coral: "from-[#ff8a5c]/35 via-[#ff5a7a]/18 to-transparent",
  teal: "from-[#23a6a0]/35 via-[#4f7cf0]/18 to-transparent",
  violet: "from-[#8e6cf0]/35 via-[#4f5bd5]/18 to-transparent",
} as const;

/**
 * Image with a designed fallback. `src === null` means the asset hasn't been supplied yet
 * (resolved on the server), so we render a gradient + icon instead of a broken image.
 */
export function ArtImage({
  src,
  alt,
  icon,
  tone,
  sizes,
  priority = false,
  contain = false,
  className,
}: {
  src: string | null;
  alt: string;
  icon: IconName;
  tone: keyof typeof PLACEHOLDER_TONES;
  sizes: string;
  priority?: boolean;
  contain?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-fill", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn(contain ? "object-contain p-3" : "object-cover", "transition-transform duration-300 group-hover:scale-[1.03]")}
        />
      ) : (
        <div className={cn("absolute inset-0 grid place-items-center bg-linear-to-br", PLACEHOLDER_TONES[tone])} aria-hidden>
          <span className="grid size-12 place-items-center rounded-2xl border border-white/10 bg-surface/60 text-label-2 backdrop-blur-sm">
            <Icon name={icon} size={22} />
          </span>
        </div>
      )}
    </div>
  );
}
