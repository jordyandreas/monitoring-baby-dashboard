import type { SVGProps } from "react";

export function PumpIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
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
      <path d="M4 10.2c0-2.3 1.6-3.9 3.6-3.9" />
      <path d="M4 10.2c0 2.3 1.6 3.9 3.6 3.9" />
      <path d="M7.6 6.3v7.8" />
      <path d="M7.6 10.2H11" />
      <path d="M11.5 6.2h6.2" />
      <path d="M12.6 6.2v11.4a2 2 0 0 0 2 2h2.3a2 2 0 0 0 2-2V6.2" />
      <path d="M12.8 14.4h5.9" />
    </svg>
  );
}
