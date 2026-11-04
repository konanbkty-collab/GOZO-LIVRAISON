"use client";

import { useRef, useState, useCallback, useEffect } from "react";

type SignaturePadProps = {
  value?: string;
  onChange: (dataUrl: string | null) => void;
  className?: string;
};

/** Signature du client sur écran (canvas) — preuve de réception. */
export default function SignaturePad({ value, onChange, className = "" }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(!!value);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0e2f63";
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    setHasInk(true);
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL("image/png"));
  };

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasInk(false);
      onChange(null);
    }
  }, [onChange]);

  // Redimensionnement : préserver le contenu
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = value;
  }, [value]);

  return (
    <div className={`overflow-hidden rounded-2xl border-2 border-dashed border-gozo-300 bg-white ${className}`}>
      <div className="flex items-center justify-between border-b border-gozo-100 bg-gozo-50 px-3 py-1.5">
        <span className="text-xs font-semibold text-gozo-700">Signature du client</span>
        {hasInk && (
          <button type="button" onClick={clear} className="text-xs font-semibold text-rose-500 hover:underline">
            Effacer
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={560}
        height={260}
        className="block h-40 w-full cursor-crosshair touch-none bg-white"
        onPointerDown={start}
        onPointerMove={draw}
        onPointerUp={end}
        onPointerLeave={end}
      />
      {!hasInk && (
        <p className="px-3 pb-2 text-center text-xs text-slate-400">Le client signe ici avec le doigt</p>
      )}
    </div>
  );
}
