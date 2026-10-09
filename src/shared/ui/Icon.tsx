type IconName = 'chat' | 'plus' | 'search' | 'send' | 'back' | 'close' | 'logout' | 'eye' | 'check';
const paths: Record<IconName, string> = {
  chat: 'M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-4 3V11.5A7.5 7.5 0 0 1 9.5 4h3a7.5 7.5 0 0 1 7.5 7.5Z M7 11h8 M7 15h5',
  plus: 'M12 5v14M5 12h14',
  search: 'M20 20l-5-5 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z',
  send: 'm21 3-7 18-4-7-7-4 18-7ZM10 14 21 3',
  back: 'm14 5-7 7 7 7 M7 12h14',
  close: 'm6 6 12 12M6 18 18 6',
  logout: 'M9 5H4v14h5 M14 8l4 4-4 4 M8 12h13',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  check: 'm4 12 5 5L20 6',
};

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
