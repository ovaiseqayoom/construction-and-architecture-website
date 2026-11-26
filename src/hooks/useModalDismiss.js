import { useEffect, useCallback } from "react";

export default function useModalDismiss({
  isOpen,
  onClose,
  modalRef,
  closeOnEscape = true,
  closeOnOutsideClick = true,
}) {
  const handleKeyDown = useCallback(
    (event) => {
      if (closeOnEscape && event.key === "Escape" && isOpen && onClose) {
        event.stopPropagation();
        onClose();
      }
    },
    [closeOnEscape, isOpen, onClose]
  );

  const handleClickOutside = useCallback(
    (event) => {
      if (!closeOnOutsideClick || !isOpen || !onClose || !modalRef?.current) return;
      if (!modalRef.current.contains(event.target)) {
        onClose();
      }
    },
    [closeOnOutsideClick, isOpen, onClose, modalRef]
  );

  useEffect(() => {
    if (!isOpen) return;

    if (closeOnEscape) {
      window.addEventListener("keydown", handleKeyDown);
    }
    if (closeOnOutsideClick && modalRef) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      if (closeOnEscape) {
        window.removeEventListener("keydown", handleKeyDown);
      }
      if (closeOnOutsideClick && modalRef) {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      }
    };
  }, [isOpen, closeOnEscape, closeOnOutsideClick, handleKeyDown, handleClickOutside, modalRef]);
}
