import React from "react";

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    padding?: "none" | "sm" | "md" | "lg";
}

export default function Card({
                                 children,
                                 className = "",
                                 onClick,
                                 padding = "md",
                             }: CardProps) {
    const paddings = {
        none: "",
        sm: "p-3",
        md: "p-4",
        lg: "p-5",
    };

    return (
        <div
            className={`
        bg-white rounded-2xl
        shadow-[0_1px_8px_rgba(0,0,0,0.06)]
        ${paddings[padding]}
        ${onClick ? "cursor-pointer active:scale-98 transition-transform duration-150" : ""}
        ${className}
      `}
            onClick={onClick}
        >
            {children}
        </div>
    );
}