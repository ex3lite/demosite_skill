import type { SVGProps } from "react";

// Минималистичный SVG-набор в духе Lucide (stroke=currentColor). НИКАКИХ эмодзи.
const PATHS: Record<string, string> = {
  check: "M20 6 9 17l-5-5",
  "check-circle": "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01l-3-3",
  arrowRight: "M5 12h14 M13 6l6 6-6 6",
  arrowUpRight: "M7 17 17 7 M7 7h10v10",
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z",
  mail: "M4 4h16v16H4z M22 6l-10 7L2 6",
  mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 10a3 3 0 1 0 0-1z",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  award: "M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M8.5 13.5 7 22l5-3 5 3-1.5-8.5",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z",
  quote: "M3 21c3-1 5-3 5-7H4V7h8v7c0 4-3 6-9 7z M14 21c3-1 5-3 5-7h-4V7h8v7c0 4-3 6-9 7z",
  plus: "M12 5v14 M5 12h14",
  minus: "M5 12h14",
  chevronDown: "M6 9l6 6 6-6",
  menu: "M3 12h18 M3 6h18 M3 18h18",
  x: "M18 6 6 18 M6 6l12 12",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  briefcase: "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
  heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21l8.84-8.61a5.5 5.5 0 0 0 0-7.78z",
  sparkle: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z",
  send: "M22 2 11 13 M22 2l-7 20-4-9-9-4 20-7z",
  zap: "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
  truck: "M1 3h15v13H1z M16 8h4l3 3v5h-7 M5.5 18.5a2 2 0 1 0 0-1z M18.5 18.5a2 2 0 1 0 0-1z",
  leaf: "M11 20A7 7 0 0 1 4 13c0-6 7-11 16-11 0 9-5 16-9 18z M11 20c0-4 2-8 6-10",
  scissors: "M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M20 4 8.12 15.88 M14.47 14.48 20 20 M8.12 8.12 12 12",
  wrench: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-2.4 2.6-2.6z",
  home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  tooth: "M12 5.5C9.5 3 4 3 4 8c0 5 1.5 11 3.5 11S9 14 12 14s2.5 5 4.5 5S20 13 20 8c0-5-5.5-5-8-2.5z",
  graduation: "M22 10 12 5 2 10l10 5 10-5z M6 12v5c0 1 3 3 6 3s6-2 6-3v-5",
  dumbbell: "M6.5 6.5 17.5 17.5 M21 21l-1-1 M3 3l1 1 M18 12l3-3 M3 12l3 3 M6 9l3 3 M15 12l3 3",
  camera: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  building: "M3 21h18 M5 21V7l8-4v18 M19 21V11l-6-4 M9 9v.01 M9 12v.01 M9 15v.01",
};

export function Icon({ name, className = "w-5 h-5", ...rest }: { name: string } & SVGProps<SVGSVGElement>) {
  const d = PATHS[name] ?? PATHS.check;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...rest}>
      {d.split(" M").map((seg, i) => (
        <path key={i} d={(i === 0 ? seg : "M" + seg)} />
      ))}
    </svg>
  );
}
