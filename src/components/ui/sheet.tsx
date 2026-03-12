"use client";

import * as React from "react";
import { createPortal } from "react-dom";

/* ─── Context ─────────────────────────────────────────────── */
const SheetContext = React.createContext<{ onClose: () => void }>({ onClose: () => {} });

/* ─── Root ────────────────────────────────────────────────── */
function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <SheetContext.Provider value={{ onClose: () => onOpenChange(false) }}>
      {createPortal(children, document.body)}
    </SheetContext.Provider>
  );
}

/* ─── Content ─────────────────────────────────────────────── */
function SheetContent({
  children,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { onClose } = React.useContext(SheetContext);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 50,
        }}
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: 400,
          maxWidth: "100vw",
          background: "white",
          zIndex: 51,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
          ...style,
        }}
        {...props}
      >
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          aria-label="閉じる"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 18,
            color: "#666",
            borderRadius: 6,
            lineHeight: 1,
          }}
        >
          ×
        </button>
        {children}
      </div>
    </>
  );
}

/* ─── Header ──────────────────────────────────────────────── */
function SheetHeader({ children, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        padding: "20px 24px 16px",
        borderBottom: "1px solid #e5e7eb",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

/* ─── Title ───────────────────────────────────────────────── */
function SheetTitle({ children, style, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      style={{
        margin: 0,
        fontSize: 16,
        fontWeight: 600,
        lineHeight: 1.4,
        paddingRight: 32,
        ...style,
      }}
      {...props}
    >
      {children}
    </h2>
  );
}

/* ─── Footer ──────────────────────────────────────────────── */
function SheetFooter({ children, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 8,
        padding: "16px 24px",
        borderTop: "1px solid #e5e7eb",
        marginTop: "auto",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter };
