import { cn } from "@/lib/utils";

type FlagIconProps = {
  className?: string;
};

export function FlagEn({ className }: FlagIconProps) {
  return (
    <svg
      viewBox="0 0 60 40"
      className={cn("h-4 w-6 shrink-0 overflow-hidden rounded-[2px]", className)}
      aria-hidden
    >
      <rect width="60" height="40" fill="#012169" />
      <path d="M0 0 L60 40 M60 0 L0 40" stroke="#FFF" strokeWidth="8" />
      <path d="M0 0 L60 40 M60 0 L0 40" stroke="#C8102E" strokeWidth="4" />
      <path d="M30 0 V40 M0 20 H60" stroke="#FFF" strokeWidth="12" />
      <path d="M30 0 V40 M0 20 H60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

export function FlagId({ className }: FlagIconProps) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={cn("h-4 w-6 shrink-0 overflow-hidden rounded-[2px]", className)}
      aria-hidden
    >
      <rect width="24" height="8" y="0" fill="#E70011" />
      <rect width="24" height="8" y="8" fill="#FFF" />
    </svg>
  );
}
