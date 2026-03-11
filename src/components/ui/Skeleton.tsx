interface SkeletonProps {
    className?: string;
    rounded?: "sm" | "md" | "lg" | "full";
}

export default function Skeleton({
                                     className = "",
                                     rounded = "md",
                                 }: SkeletonProps) {
    const radii = {
        sm: "rounded",
        md: "rounded-xl",
        lg: "rounded-2xl",
        full: "rounded-full",
    };

    return (
        <div
            className={`skeleton ${radii[rounded]} ${className}`}
        />
    );
}