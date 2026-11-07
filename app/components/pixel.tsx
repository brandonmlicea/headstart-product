import { useEffect, useRef } from "react";
import { paint } from "../../kit/pixel.mjs";

type Props = { scene: string; w?: number; h?: number; seed?: number; dissolve?: string; className?: string };

export function Pixel({ scene, w = 160, h = 120, seed = 7, dissolve = "", className = "" }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) paint(ref.current, { scene, width: w, height: h, seed, dissolve });
  }, [scene, w, h, seed, dissolve]);
  return <canvas ref={ref} width={w} height={h} aria-hidden="true" className={`block ${className}`} />;
}
