/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useDroppable } from "@dnd-kit/core";
import { FieldPosition, Player } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { User, X } from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";

interface DroppableSlotProps {
  position: FieldPosition;
  player: Player | null;
  onRemove?: (id: string) => void;
  activePlayer: Player | null;
  voteCount?: number;
}

export function DroppableSlot({ position, player, onRemove, activePlayer, voteCount }: DroppableSlotProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: position.id,
    data: position,
  });

  const isCompatible = activePlayer ? activePlayer.category === position.category : true;
  const showInvalid = activePlayer && !isCompatible && isOver;
  const showValid = activePlayer && isCompatible && isOver;

  return (
    <div
      ref={setNodeRef}
      className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group transition-all duration-300 ${activePlayer && !isCompatible ? "opacity-30 grayscale-[0.5]" : "opacity-100"}`}
      style={{ top: `${position.top}%`, left: `${position.left}%` }}
    >
      <motion.div
        animate={{
          scale: isOver ? 1.1 : 1,
          backgroundColor: showInvalid 
            ? "rgba(244, 63, 94, 0.4)" 
            : showValid 
              ? "rgba(34, 197, 94, 0.4)" 
              : isOver 
                ? "rgba(255, 255, 255, 0.4)" 
                : "rgba(255, 255, 255, 0.2)",
        }}
        className={`
          w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 
          flex items-center justify-center relative transition-shadow
          ${player ? "shadow-lg bg-white/10 border-white/40" : "border-dashed border-white/30"}
          ${showInvalid ? "border-rose-500 ring-2 ring-rose-500/30" : ""}
          ${showValid ? "border-green-500 ring-2 ring-green-500/30 font-bold" : ""}
          ${isOver && !activePlayer ? "ring-2 ring-white/30" : ""}
        `}
      >
        <AnimatePresence mode="wait">
          {player ? (
            <motion.div
              key={player.id}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="w-full h-full flex flex-col items-center justify-center"
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white flex items-center justify-center text-[#5da261] z-10 overflow-hidden shadow-sm">
                <ImageWithFallback 
                  src={player.image || player.clubLogoUrl} 
                  fallbackSrc={player.clubFallbackUrl}
                  alt={player.name}
                  isPortrait={!!player.image}
                  size={20}
                />
              </div>

              {voteCount !== undefined && (
                <div className="absolute -bottom-2 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold z-20 shadow-md">
                   {voteCount}
                </div>
              )}
              
              {onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(position.id);
                  }}
                  className="absolute -top-1 -right-1 bg-white text-rose-500 rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-20"
                >
                  <X size={14} />
                </button>
              )}
            </motion.div>
          ) : (
            <div className="text-white/40 font-bold text-xs">{position.label}</div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="max-w-[80px] sm:max-w-[100px] text-center">
        <p className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider drop-shadow-md truncate px-1">
          {player ? player.name.split(" ").pop() : ""}
        </p>
      </div>
    </div>
  );
}
