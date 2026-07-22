"use client";

import { useState, useRef } from "react";
import { Trash2, Check, Archive } from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: { icon: React.ReactNode; label: string; color: string };
  rightAction?: { icon: React.ReactNode; label: string; color: string };
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
}: SwipeableCardProps) {
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);

  const leftBg = useTransform(x, [-150, -50, 0], ["#ef4444", "#f97316", "transparent"]);
  const rightBg = useTransform(x, [0, 50, 150], ["transparent", "#22c55e", "#22c55e"]);
  const leftOpacity = useTransform(x, [-150, -50, 0], [1, 0.5, 0]);
  const rightOpacity = useTransform(x, [0, 50, 150], [0, 0.5, 1]);

  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    setIsDragging(false);
    const threshold = 80;
    const velocityThreshold = 500;

    if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      animate(x, -300, { duration: 0.2 });
      setTimeout(() => {
        onSwipeLeft?.();
        animate(x, 0, { duration: 0.1 });
      }, 200);
    } else if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      animate(x, 300, { duration: 0.2 });
      setTimeout(() => {
        onSwipeRight?.();
        animate(x, 0, { duration: 0.1 });
      }, 200);
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Left action (delete) */}
      {(onSwipeLeft || leftAction) && (
        <motion.div
          className="absolute inset-y-0 left-0 flex items-center px-4"
          style={{ backgroundColor: leftAction?.color || "#ef4444", opacity: leftOpacity }}
        >
          {leftAction?.icon || <Trash2 className="h-5 w-5 text-white" />}
          <span className="text-white text-xs font-semibold ml-2">{leftAction?.label || "Удалить"}</span>
        </motion.div>
      )}

      {/* Right action (complete) */}
      {(onSwipeRight || rightAction) && (
        <motion.div
          className="absolute inset-y-0 right-0 flex items-center px-4"
          style={{ backgroundColor: rightAction?.color || "#22c55e", opacity: rightOpacity }}
        >
          <span className="text-white text-xs font-semibold mr-2">{rightAction?.label || "Готово"}</span>
          {rightAction?.icon || <Check className="h-5 w-5 text-white" />}
        </motion.div>
      )}

      {/* Card content */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        className={`relative z-10 ${isDragging ? "cursor-grabbing" : ""}`}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function SwipeableTaskCard({
  children,
  onComplete,
  onDelete,
}: {
  children: React.ReactNode;
  onComplete?: () => void;
  onDelete?: () => void;
}) {
  const [swiped, setSwiped] = useState<"left" | "right" | null>(null);

  return (
    <SwipeableCard
      onSwipeLeft={() => {
        setSwiped("left");
        onDelete?.();
      }}
      onSwipeRight={() => {
        setSwiped("right");
        onComplete?.();
      }}
      leftAction={{
        icon: <Trash2 className="h-5 w-5 text-white" />,
        label: "Удалить",
        color: "#ef4444",
      }}
      rightAction={{
        icon: <Check className="h-5 w-5 text-white" />,
        label: "Готово",
        color: "#22c55e",
      }}
    >
      {children}
    </SwipeableCard>
  );
}
