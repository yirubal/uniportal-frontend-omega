import React from "react";
import WebApp from "@twa-dev/sdk";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    fullWidth?: boolean;
    children: React.ReactNode;
    /** React 19 passes ref as a prop; it reaches the <button> through ...props. */
    ref?: React.Ref<HTMLButtonElement>;
}

export default function Button({
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    children,
    disabled,
    className = "",
    onClick,
    ...props
}: ButtonProps) {
    const supportsHaptics = WebApp.isVersionAtLeast?.("6.1") ?? false;
    const base =
        "inline-flex min-h-11 items-center justify-center gap-2 font-semibold rounded-[18px] transition-all duration-200 active:scale-[0.985] disabled:cursor-not-allowed disabled:shadow-none";

    const variants = {
        primary:
            "border border-ink bg-ink text-white shadow-[0_10px_24px_rgba(23,43,47,0.10)] disabled:border-disabled disabled:bg-disabled disabled:text-[#344E53]",
        secondary:
            "border border-accent-line bg-accent-soft text-accent-deep disabled:border-[#DCE5E1] disabled:bg-background disabled:text-[#5E7479]",
        ghost:
            "border border-[rgba(23,43,47,0.08)] bg-[rgba(244,247,252,0.92)] text-ink shadow-none disabled:bg-background disabled:text-[#5E7479]",
        danger:
            "border border-danger bg-danger text-white disabled:border-[#E9CBC7] disabled:bg-[#E9CBC7] disabled:text-[#7C4B47]",
    };

    const sizes = {
        sm: "px-3.5 py-2.5 text-xs",
        md: "px-5 py-3 text-sm",
        lg: "px-6 py-3.5 text-[15px]",
    };

    return (
        <button
            onClick={(event) => {
                if (!disabled && !loading && supportsHaptics) {
                    WebApp.HapticFeedback.impactOccurred(variant === "ghost" ? "light" : "medium");
                }
                onClick?.(event);
            }}
            className={`
        ${base}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <span className="flex items-center gap-2">
          <span
              className="w-4 h-4 border-2 border-current border-t-transparent
                       rounded-full animate-spin"
          />
          Loading...
        </span>
            ) : (
                children
            )}
        </button>
    );
}
