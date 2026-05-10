'use client';

interface BackdropProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Backdrop({ isOpen, onClose }: BackdropProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300"
      onClick={onClose}
      aria-label="Close menu"
    />
  );
}
