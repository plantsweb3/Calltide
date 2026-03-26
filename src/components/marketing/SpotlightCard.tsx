"use client";

import { useRef, useState } from "react";

export function SpotlightCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div ref={cardRef} className={`relative overflow-hidden transition-all duration-300 ${className}`} onMouseMove={handleMouseMove} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300" style={{ opacity: isHovered ? 1 : 0, background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(0,0,0,0.03), transparent 40%)` }} />
      {children}
    </div>
  );
}
