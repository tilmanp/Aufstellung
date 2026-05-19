/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Player } from "../types";
import { User, Edit2, Trash2 } from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";

interface DraggablePlayerProps {
  player: Player;
  isOverlay?: boolean;
  disabled?: boolean;
}

export function DraggablePlayer({ player, isOverlay, disabled }: DraggablePlayerProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: player.id,
    data: player,
    disabled: disabled
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging && !isOverlay ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm border border-slate-100 
        cursor-grab active:cursor-grabbing hover:border-[#5da261] hover:shadow-md transition-all group
        ${isOverlay ? "shadow-xl border-[#5da261] z-50 ring-2 ring-[#5da261]/20" : ""}
        ${disabled ? "opacity-60 cursor-not-allowed grayscale pointer-events-none" : ""}
      `}
    >
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
        <ImageWithFallback 
          src={player.image || player.clubLogoUrl} 
          fallbackSrc={player.clubFallbackUrl}
          alt={player.name}
          isPortrait={!!player.image}
          size={16}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-800 truncate leading-tight">{player.name}</p>
        <div className="flex items-center gap-1 min-w-0">
           <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide shrink-0">{player.category}</p>
           {player.club && (
             <>
               <span className="text-slate-300">·</span>
               <p className="text-[9px] text-slate-500 font-medium truncate leading-tight">{player.club}</p>
             </>
           )}
        </div>
      </div>

      {player.number && !isOverlay && (
        <span className="text-xs font-bold text-slate-300 w-6 text-right group-hover:hidden whitespace-nowrap">#{player.number}</span>
      )}
    </div>
  );
}
