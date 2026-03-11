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
        "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-[#0A1628] text-[#FFB400]",
        secondary: "bg-[#FFB400] text-[#0A1628]",
        ghost: "bg-transparent text-[#0A1628] border-2 border-[#0A1628]",
        danger: "bg-[#F44336] text-white",
    };

    const sizes = {
        sm: "px-3 py-2 text-xs",
        md: "px-5 py-3 text-sm",
        lg: "px-6 py-4 text-base",
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