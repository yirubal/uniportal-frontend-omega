interface BadgeProps {
    label: string;
    bg: string;
    text: string;
    dot?: string;
}

export default function Badge({ label, bg, text, dot }: BadgeProps) {
    return (
        <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: bg, color: text }}
        >
      {dot && (
          <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: dot }}
          />
      )}
            {label}
    </span>
    );
}