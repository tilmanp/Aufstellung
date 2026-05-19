/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Formation, Player } from "../types";
import { DroppableSlot } from "./DroppableSlot";

interface FieldProps {
  formation: Formation;
  lineup: Record<string, Player | null>;
  onRemove?: (slotId: string) => void;
  activePlayer: Player | null;
  playerVotes?: Record<string, number>;
}

export function Field({ formation, lineup, onRemove, activePlayer, playerVotes }: FieldProps) {
  return (
    <div className="relative w-full aspect-[2/3] max-w-lg mx-auto bg-[#5da261] rounded-2xl overflow-hidden shadow-2xl border-[12px] border-white/10">
      {/* Field Markings */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 border-t-2 border-white/40" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-1/3 aspect-square border-2 border-white/40 rounded-full" />
        <div className="absolute w-full h-[1px] bg-white/40" />
      </div>
      
      {/* Penalty Areas */}
      <div className="absolute top-0 inset-x-1/4 h-[15%] border-b-2 border-x-2 border-white/40 rounded-b-sm" />
      <div className="absolute top-0 inset-x-[35%] h-[6%] border-b-2 border-x-2 border-white/40 rounded-b-sm" />
      
      <div className="absolute bottom-0 inset-x-1/4 h-[15%] border-t-2 border-x-2 border-white/40 rounded-t-sm" />
      <div className="absolute bottom-0 inset-x-[35%] h-[6%] border-t-2 border-x-2 border-white/40 rounded-t-sm" />

      {/* Slots */}
      {formation.positions.map((pos) => (
        <DroppableSlot
          key={pos.id}
          position={pos}
          player={lineup[pos.id] || null}
          onRemove={onRemove}
          activePlayer={activePlayer}
          voteCount={playerVotes && lineup[pos.id] ? playerVotes[lineup[pos.id]!.id] : undefined}
        />
      ))}
    </div>
  );
}
