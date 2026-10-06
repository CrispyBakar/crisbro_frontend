import { useEffect, useState } from "react";

// Keyboard layar memangkas tinggi viewport jauh lebih besar daripada address
// bar browser yang muncul/hilang saat scroll (sekitar 50-60px)
const KEYBOARD_MIN_HEIGHT = 150;

const NON_TEXT_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

const isTextEntry = (element: Element | null) =>
  element instanceof HTMLTextAreaElement ||
  (element instanceof HTMLInputElement &&
    !NON_TEXT_INPUT_TYPES.has(element.type)) ||
  (element instanceof HTMLElement && element.isContentEditable);

// Browser tidak punya event "keyboard terbuka". Penandanya: viewport memendek
// jauh dari tinggi normalnya selagi fokus ada di kolom teks.
export const useOnScreenKeyboard = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    let baseWidth = viewport.width;
    let fullHeight = viewport.height;

    const handleResize = () => {
      // Lebar berubah berarti layar diputar atau di-zoom: tinggi acuan diulang
      if (viewport.width !== baseWidth) {
        baseWidth = viewport.width;
        fullHeight = viewport.height;
      }
      fullHeight = Math.max(fullHeight, viewport.height);

      setIsOpen(
        fullHeight - viewport.height > KEYBOARD_MIN_HEIGHT &&
          isTextEntry(document.activeElement),
      );
    };

    viewport.addEventListener("resize", handleResize);
    return () => viewport.removeEventListener("resize", handleResize);
  }, []);

  return isOpen;
};
