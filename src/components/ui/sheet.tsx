"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Context ────────────────────────────────────────────── */
type SheetContextValue = { onClose: () => void };
const SheetContext = React.createContext<SheetContextValue>({ onClose: () => {} });

/* ─── Root ───────────────────────────────────────────────── */
function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  // body scroll lock
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <SheetContext.Provider value={{ onClose: () => onOpenChange(false) }}>
      {createPortal(children, document.body)}
    </SheetContext.Provider>
  );
}

/* ─── Content ────────────────────────────────────────────── */
type Side = "right" | "left" | "bottom";

const sideStyles: Record<Side, string> = {
  right:  "top-0 right-0 h-full w-full sm:max-w-md",
  left:   "top-0 left-0 h-full w-full sm:max-w-md",
  bottom: "bottom-0 left-0 w-full max-h-[85vh] rounded-t-2xl",
};

function SheetContent({
  side = "right",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { side?: Side }) {
  const { onClose } = React.useContext(SheetContext);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed z-50 flex flex-col bg-background shadow-xl",
          sideStyles[side],
          className
        )}
        {...props}
      >
        {children}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="閉じる"
        >
          <XIcon size={16} />
        </button>
      </div>
    </>
  );
}

/* ─── Header / Title / Footer ────────────────────────────── */
function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 px-6 py-5 border-b", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-base font-semibold leading-none", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 px-6 py-4 border-t sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  );
}

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter };
