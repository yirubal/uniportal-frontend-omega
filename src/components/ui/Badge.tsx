interface BadgeProps {
    label: string;
    bg: string;
    text: string;
    dot?: string;
}

export default function Badge({ label, bg, text, dot }: BadgeProps) {
    return (
        <span
            className="app-badge"
            style={{ backgroundColor: bg, color: text }}
        >
      {dot && (
          <span
              className="app-badge-dot"
              style={{ backgroundColor: dot }}
          />
      )}
            {label}
        </span>
    );
}
