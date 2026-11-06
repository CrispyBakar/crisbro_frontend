import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";

interface DraggableProps {
  children?: ReactNode;
  className?: string;
  /** Selektor CSS ancestor pembatas area drag (mis. "main"); tanpa ini dibatasi viewport */
  bounds?: string;
  /** Penempatan awal di dalam area drag: "top-left" (default), "center", atau "middle-left" */
  placement?: "top-left" | "center" | "middle-left";
  initialX?: number;
  initialY?: number;
  /** Dipanggil saat elemen di-tap/klik tanpa digeser (pergeseran < 6px) */
  onTap?: () => void;
}

interface BoundsRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

// Elemen melayang yang bisa digeser, tetap terbatas pada area `bounds` (default: viewport)
const Draggable = ({
  children,
  className,
  bounds,
  placement = "top-left",
  initialX = 16,
  initialY = 16,
  onTap,
}: DraggableProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  // Jarak kursor dari tepi elemen saat mulai drag (ref agar tidak hilang saat re-render)
  const dragOffset = useRef<{ x: number; y: number } | null>(null);
  // Titik awal pointer, untuk membedakan tap dari drag
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const didInitPosition = useRef(false);

  // Area yang boleh dijangkau: irisan kotak ancestor `bounds` dengan viewport
  const getBounds = useCallback((): BoundsRect => {
    const container = bounds ? ref.current?.closest(bounds) : null;
    const rect = container?.getBoundingClientRect();
    if (!rect) {
      return {
        left: 0,
        top: 0,
        right: window.innerWidth,
        bottom: window.innerHeight,
      };
    }
    return {
      left: Math.max(rect.left, 0),
      top: Math.max(rect.top, 0),
      right: Math.min(rect.right, window.innerWidth),
      bottom: Math.min(rect.bottom, window.innerHeight),
    };
  }, [bounds]);

  const clampToBounds = useCallback(
    (x: number, y: number, width: number, height: number) => {
      const b = getBounds();
      return {
        x: clamp(x, b.left, Math.max(b.left, b.right - width)),
        y: clamp(y, b.top, Math.max(b.top, b.bottom - height)),
      };
    },
    [getBounds],
  );

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    dragStart.current = { x: e.clientX, y: e.clientY };
    // Tangkap pointer agar drag tetap jalan walau kursor lepas dari elemen
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const offset = dragOffset.current;
    const rect = ref.current?.getBoundingClientRect();
    if (!offset || !rect) return;
    setPosition(
      clampToBounds(
        e.clientX - offset.x,
        e.clientY - offset.y,
        rect.width,
        rect.height,
      ),
    );
  };

  const endDrag = () => {
    dragOffset.current = null;
    dragStart.current = null;
  };

  // Tap = pointer berakhir nyaris tanpa pergeseran, jadi drag tidak memicu onTap
  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    endDrag();
    if (!start || !onTap) return;
    const distance = Math.hypot(e.clientX - start.x, e.clientY - start.y);
    if (distance < 6) onTap();
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!onTap) return;
    if (e.key === "Enter" || e.key === " ") {
      // Space default-nya men-scroll halaman, cegah
      e.preventDefault();
      onTap();
    }
  };

  // Saat drag dengan sentuhan, cegah halaman ikut ter-scroll.
  // touch-action: none sudah ada di elemen, tetapi beberapa browser/simulator
  // mobile mengabaikannya — listener native non-passive membuat preventDefault sah.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const preventScroll = (e: TouchEvent) => {
      if (dragOffset.current) e.preventDefault();
    };
    el.addEventListener("touchmove", preventScroll, { passive: false });
    return () => el.removeEventListener("touchmove", preventScroll);
  }, []);

  // Posisi awal relatif terhadap area drag (sebelum paint agar tidak berkedip)
  useLayoutEffect(() => {
    if (didInitPosition.current) return;
    didInitPosition.current = true;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const b = getBounds();
    // Posisi awal di dalam area drag sesuai `placement`
    const centerX = b.left + (b.right - b.left - rect.width) / 2;
    const centerY = b.top + (b.bottom - b.top - rect.height) / 2;
    const startX = placement === "center" ? centerX : b.left + initialX;
    const startY = placement === "top-left" ? b.top + initialY : centerY;
    setPosition(clampToBounds(startX, startY, rect.width, rect.height));
  }, [getBounds, clampToBounds, placement, initialX, initialY]);

  // Saat layar berubah ukuran, jaga elemen tetap di dalam area drag
  useEffect(() => {
    const onResize = () => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition((prev) =>
        clampToBounds(prev.x, prev.y, rect.width, rect.height),
      );
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampToBounds]);

  return (
    <div
      ref={ref}
      className={`fixed touch-none select-none cursor-grab active:cursor-grabbing ${className ?? ""}`}
      style={{
        left: position.x,
        top: position.y,
        // Inline agar pasti berlaku walau class touch-none gagal digenerate
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={endDrag}
      onKeyDown={handleKeyDown}
      role={onTap ? "button" : undefined}
      tabIndex={onTap ? 0 : undefined}
    >
      {children}
    </div>
  );
};

export default Draggable;
