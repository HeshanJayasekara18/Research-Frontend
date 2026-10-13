import Image from "next/image";

import { cn } from "@/components/ui/styles";

export const BOT_NAME = "Youbeyo";

/**
 * Youbeyo, the assistant's avatar, inside a glowing animated ring (faster while searching).
 * `size`: pixels, or any CSS length (e.g. "100%") so a parent can size it responsively.
 */
export function BotOrb({ size = 168, thinking = false, priority = false }: { size?: number | string; thinking?: boolean; priority?: boolean }) {
  const imageSizes = typeof size === "number" ? `${size}px` : "(max-width: 640px) 140px, 240px";
  return (
    <div
      className="relative isolate flex-none rounded-full shadow-[0_18px_60px_rgba(90,120,255,0.35),0_0_90px_rgba(255,140,60,0.2)]"
      style={{ width: size, height: size }}
      role="img"
      aria-label={thinking ? `${BOT_NAME} is searching` : `${BOT_NAME}, your assistant bot`}
    >
      {/* Rotating colour ring behind the avatar (matches the bot's orange/blue glow). */}
      <div
        className={cn(
          "absolute inset-0 rounded-full blur-[0.5px] saturate-[1.15]",
          "bg-[conic-gradient(from_0deg,#ff8a3d,#ffd36b,#39d0ff,#5a7cff,#b34dff,#ff5a7a,#ff8a3d)]",
          thinking ? "animate-orb-fast" : "animate-orb",
        )}
        aria-hidden
      />
      <div className="absolute inset-[5%] overflow-hidden rounded-full bg-[#f6efe9] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)]">
        {/* next/image serves a resized, compressed copy of the 1254px source. */}
        <Image
          src="/images/youbeyobot.png"
          alt=""
          fill
          sizes={imageSizes}
          priority={priority}
          className={cn("scale-108 object-cover object-[50%_35%]", thinking && "animate-bob")}
        />
      </div>
    </div>
  );
}
