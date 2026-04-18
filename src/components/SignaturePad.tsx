/**
 * Canvas-based signature pad (DocuSign-style rectangle).
 *
 * Emits the signature as a PNG dataURL via `onChange`. Clearing the pad
 * emits an empty string. Works with both mouse and touch input.
 */
import * as React from "react";
import { Eraser } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  width?: number;
  height?: number;
  className?: string;
}

export default function SignaturePad({
  id,
  value,
  onChange,
  width = 600,
  height = 160,
  className,
}: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const drawing = React.useRef(false);
  const last = React.useRef<{ x: number; y: number } | null>(null);
  const [hasContent, setHasContent] = React.useState(!!value);
  const initialValueRef = React.useRef(value);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#111";
    const initial = initialValueRef.current;
    if (initial && initial.startsWith("data:image")) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = initial;
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  function getPoint(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const source =
      "touches" in e ? e.touches[0] ?? e.changedTouches[0] : e;
    if (!source) return null;
    return {
      x: (source.clientX - rect.left) * scaleX,
      y: (source.clientY - rect.top) * scaleY,
    };
  }

  function start(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const p = getPoint(e);
    if (!p) return;
    drawing.current = true;
    last.current = p;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
      ctx.fillStyle = "#111";
      ctx.fill();
    }
  }

  function move(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !last.current) return;
    const p = getPoint(e);
    if (!p) return;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  }

  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setHasContent(true);
    onChange(dataUrl);
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
    onChange("");
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative rounded-md border-2 border-dashed border-input bg-white">
        <canvas
          id={id}
          ref={canvasRef}
          width={width}
          height={height}
          className="block w-full h-[160px] touch-none cursor-crosshair rounded-md"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
        {!hasContent && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            Подпишете тук с мишка или пръст
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Eraser className="h-3 w-3" /> Изчисти подписа
        </button>
      </div>
    </div>
  );
}
