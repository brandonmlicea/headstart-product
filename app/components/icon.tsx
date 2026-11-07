const PATHS = {
  heart: "M12 20s-7.5-4.5-7.5-10A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.4c0 5.5-7.5 10-7.5 10Z",
  plus: "M12 5v14M5 12h14",
  clip: "m20 11.5-7.6 7.6a5 5 0 0 1-7.1-7.1l8-8a3.4 3.4 0 0 1 4.8 4.8l-8 8a1.7 1.7 0 0 1-2.4-2.4l7.3-7.3",
  camera: "M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5ZM12 16a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z",
  mic: "M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3ZM6 11.5a6 6 0 0 0 12 0M12 17.5V21",
  stop: "M7 7h10v10H7Z",
  send: "M12 19V5M6 11l6-6 6 6",
  speaker: "M4 9.5h3.5L12 6v12l-4.5-3.5H4ZM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11",
  copy: "M9 9h10v10H9ZM5 15V5h10",
  trash: "M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12",
  x: "M6 6l12 12M18 6 6 18",
  menu: "M4 7h16M4 12h16M4 17h16",
  palette: "M12 4a8 8 0 1 0 0 16c1.1 0 1.6-.8 1.6-1.6 0-1.3-1.1-1.6-1.1-2.7 0-.9.7-1.5 1.6-1.5H16a4 4 0 0 0 4-4C20 6.9 16.4 4 12 4ZM7.5 12.5h.01M9.5 8.5h.01M14.5 8.5h.01",
  out: "M14 5h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-4M10 16l4-4-4-4M14 12H4",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4",
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
