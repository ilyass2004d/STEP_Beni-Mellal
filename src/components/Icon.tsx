const PATHS: Record<string, string> = {
  list: 'M4 6h16M4 12h16M4 18h10',
  home: 'M3 11.5L12 4l9 7.5M5.5 9.5V20h13V9.5',
  fit: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  isolate: 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12L4 7.5',
  expand: 'M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5',
  collapse: 'M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  down: 'M12 5v14M6 13l6 6 6-6',
  cube: 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM4 7.5L12 12l8-4.5M12 12v9',
  doc: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
};

export function Icon({ name }: { name: keyof typeof PATHS | string }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={PATHS[name] ?? ''} />
    </svg>
  );
}
