import type { SVGProps } from "react";

export function DiaperIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M8 4.5h8" />
      <path d="M7 4.5C4.8 5.4 3.5 7.2 3.5 10.2 3.5 16 7.2 20 12 20s8.5-4 8.5-9.8c0-3-1.3-4.8-3.5-5.7" />
      <path d="M9 4.5c.35 2.3 1.25 3.5 3 3.5s2.65-1.2 3-3.5" />
      <path d="M8.4 15.4c.8 1.3 1.9 2 3.6 2s2.8-.7 3.6-2" />
    </svg>
  );
}
