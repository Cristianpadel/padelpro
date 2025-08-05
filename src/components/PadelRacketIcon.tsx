import type { SVGProps } from 'react';

export function PadelRacketIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m15.2 15.2-3.8-3.8" />
      <path d="M12 12h.01" />
      <path d="M12 15h.01" />
      <path d="M15 12h.01" />
      <path d="M9 12h.01" />
      <path d="M12 9h.01" />
      <path d="m4.9 19.1 2.8-2.8" />
    </svg>
  );
}
