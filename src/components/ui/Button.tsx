import React from "react";

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
                               ...props
                               }: ButtonProps) {
    const base =
        "inline-flex items-center justify-center gap-2 font-semibold rounded-[20px] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_12px_28px_rgba(24,37,61,0.08)]";

    const variants = {
        primary: "bg-[#18253D] text-white border border-[#18253D]",
        secondary: "bg-[#EDF2FF] text-[#2D5BFF] border border-[#DDE6FF]",
        ghost: "bg-white/60 text-[#18253D] border border-[rgba(31,53,91,0.10)] shadow-none",
        danger: "bg-[#D95A50] text-white border border-[#D95A50]",
    };

    const sizes = {
        sm: "px-3.5 py-2.5 text-xs",
        md: "px-5 py-3.5 text-sm",
        lg: "px-6 py-4 text-[15px]",
    };

    return (
        <button
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
