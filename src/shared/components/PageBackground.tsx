import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

type PageBackgroundProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  selectionClassName?: string;
};

export default function PageBackground({
  children,
  className,
  contentClassName,
  selectionClassName,
}: PageBackgroundProps) {
  return (
    <div
      className={cn(
        "min-h-[calc(100lvh-var(--page-min-height-offset,60px))] bg-background text-foreground",
        selectionClassName,
        className,
      )}
    >
      {contentClassName ? (
        <div className={contentClassName}>{children}</div>
      ) : (
        children
      )}
    </div>
  );
}
