import React from "react";
import WebApp from "@twa-dev/sdk";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    fullWidth?: boolean;
    children: React.ReactNode;
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
        "inline-flex min-h-11 items-center justify-center gap-2 font-semibold rounded-[18px] transition-all duration-200 active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-[#172B2F] text-white border border-[#172B2F] shadow-[0_10px_24px_rgba(23,43,47,0.10)]",
        secondary: "bg-[#EAF4F1] text-[#3F6F6A] border border-[#CFE2DE]",
        ghost: "bg-[rgba(244,247,252,0.92)] text-[#172B2F] border border-[rgba(23,43,47,0.08)] shadow-none",
        danger: "bg-[#D95A50] text-white border border-[#D95A50]",
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
