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
        app-panel rounded-[28px]
        ${paddings[padding]}
        ${onClick ? "cursor-pointer active:scale-[0.985] transition-transform duration-150" : ""}
        ${className}
      `}
            onClick={onClick}
        >
            {children}
        </div>
    );
}
