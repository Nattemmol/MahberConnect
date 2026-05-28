'use client';

import * as React from "react"
import { X } from "lucide-react"

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

const Dialog = ({ isOpen, onClose, title, description, children }: DialogProps) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "32rem",
          background: "var(--glass-bg, #1a1a2e)",
          border: "1px solid var(--glass-border, rgba(255,255,255,0.15))",
          backdropFilter: "var(--glass-blur, blur(12px))",
          WebkitBackdropFilter: "var(--glass-blur, blur(12px))",
          boxShadow: "var(--glass-shadow, 0 8px 32px 0 rgba(0,0,0,0.3))",
          borderRadius: "16px",
          overflowY: "auto",
          maxHeight: "90vh",
        }}
      >
        <div style={{ padding: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
            }}
          >
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "rgb(var(--text-primary))",
              }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                padding: "0.25rem",
                borderRadius: "9999px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "rgb(var(--text-secondary))",
              }}
            >
              <X style={{ width: "1.25rem", height: "1.25rem" }} />
            </button>
          </div>
          {description && (
            <p
              style={{
                color: "rgb(var(--text-secondary))",
                fontSize: "0.875rem",
                marginBottom: "1.5rem",
              }}
            >
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export { Dialog }
