'use client';

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
}

const DropdownMenu = ({ trigger, children }: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const triggerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={triggerRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && mounted && createPortal(
        <div
          style={{
            position: "fixed",
            zIndex: 9999,
            minWidth: "12rem",
            background: "var(--glass-bg, #1a1a2e)",
            border: "1px solid var(--glass-border, rgba(255,255,255,0.15))",
            backdropFilter: "var(--glass-blur, blur(12px))",
            WebkitBackdropFilter: "var(--glass-blur, blur(12px))",
            boxShadow: "var(--glass-shadow, 0 8px 32px 0 rgba(0,0,0,0.3))",
            borderRadius: "12px",
            padding: "0.25rem 0",
          }}
          ref={(el) => {
            if (el && triggerRef.current) {
              const rect = triggerRef.current.getBoundingClientRect();
              el.style.left = Math.min(rect.right - el.offsetWidth, window.innerWidth - 16) + "px";
              el.style.top = (rect.bottom + 4) + "px";
            }
          }}
        >
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>, {
                  onClick: (e: React.MouseEvent) => {
                    child.props.onClick?.(e);
                    setIsOpen(false);
                  },
                })
              : child,
          )}
        </div>,
        document.body,
      )}
    </div>
  );
};

interface DropdownMenuItemProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

const DropdownMenuItem = ({ onClick, children, className }: DropdownMenuItemProps) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={cn(
      "w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface-active transition-colors flex items-center gap-2",
      className
    )}
  >
    {children}
  </button>
);

export { DropdownMenu, DropdownMenuItem }
