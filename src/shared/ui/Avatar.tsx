export function Avatar({ name, id }: { name: string; id: string }) {
  const hue = [...id].reduce((sum, char) => sum + char.charCodeAt(0) * 17, 0) % 360;
  const initials = name.startsWith('+')
    ? name.slice(-2)
    : name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
  return (
    <span className="avatar" style={{ background: `hsl(${hue} 65% 63%)` }} aria-hidden="true">
      {initials}
    </span>
  );
}
