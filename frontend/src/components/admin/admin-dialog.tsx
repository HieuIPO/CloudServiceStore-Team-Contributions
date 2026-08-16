"use client";

import React, { useEffect, useRef, useId } from "react";
import { IconX } from "@tabler/icons-react";

export type AdminDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidthClass?: string;
  isSubmitting?: boolean;
};

export function AdminDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidthClass = "max-w-md",
  isSubmitting = false
}: AdminDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const focusTimerRef = useRef<number | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialogNode = dialogRef.current;
    if (!dialogNode) return;

    if (focusTimerRef.current !== null) {
      window.clearTimeout(focusTimerRef.current);
      focusTimerRef.current = null;
    }

    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      if (!dialogNode.open) {
        dialogNode.showModal();
      }
      // Focus first focusable element inside dialog
      const firstFocusable = dialogNode.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusable) {
        focusTimerRef.current = window.setTimeout(() => {
          focusTimerRef.current = null;
          if (dialogRef.current?.open && isOpen) firstFocusable.focus();
        }, 50);
      }
    } else {
      if (dialogNode.open) {
        dialogNode.close();
      }
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }

    return () => {
      if (focusTimerRef.current !== null) {
        window.clearTimeout(focusTimerRef.current);
        focusTimerRef.current = null;
      }
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    if (e.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) ?? []
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // Handle native cancel event (Escape key)
  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement, Event>) => {
    e.preventDefault();
    if (!isSubmitting) {
      onClose();
    }
  };

  // Close when clicking backdrop outside dialog box
  const handleClickBackdrop = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current && !isSubmitting) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      role="dialog"
      onCancel={handleCancel}
      onKeyDown={handleKeyDown}
      onClick={handleClickBackdrop}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      aria-modal="true"
      className={`fixed inset-0 m-auto p-0 bg-transparent backdrop:bg-slate-900/50 open:flex open:items-center open:justify-center z-50 w-full ${maxWidthClass}`}
    >
      <div className="bg-white border border-slate-200 shadow-xl rounded-lg w-full p-5 text-xs space-y-4 m-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h3 id={titleId} className="font-bold text-slate-900 text-sm">
              {title}
            </h3>
            {description && (
              <p id={descId} className="text-slate-500 text-[11px] mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (!isSubmitting) onClose();
            }}
            disabled={isSubmitting}
            aria-label="Đóng cửa sổ"
            className="text-slate-400 hover:text-slate-600 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            <IconX size={18} />
          </button>
        </div>

        <div>{children}</div>
      </div>
    </dialog>
  );
}
