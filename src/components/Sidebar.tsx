/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Player, PositionCategory } from "../types";
import { CATEGORIES } from "../constants";
import { DraggablePlayer } from "./DraggablePlayer";
import { Search, Plus, FileText, Upload, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SidebarProps {
  players: Player[];
  usedPlayerIds: Set<string>;
  disabled?: boolean;
}

export function Sidebar({ players, usedPlayerIds, disabled }: SidebarProps) {
  const [selectedCategory, setSelectedCategory] = useState<PositionCategory>("Tor");
  const [search, setSearch] = useState("");

  const filteredPlayers = players.filter(
    (p) => 
      p.category === selectedCategory && 
      (p.name.toLowerCase().includes(search.toLowerCase()) || 
       (p.club?.toLowerCase().includes(search.toLowerCase()) ?? false)) &&
      !usedPlayerIds.has(p.id)
  );

  return (
    <div className="w-full lg:w-72 h-screen flex flex-col bg-white border-l border-slate-200 shadow-xl z-30">
      <div className="p-3 border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Kader</h2>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Suchen..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs focus:ring-2 focus:ring-[#5da261]/20 transition-all outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-1 text-[10px]">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`
                px-2.5 py-1.5 rounded-full font-bold transition-all
                ${selectedCategory === cat 
                  ? "bg-[#5da261] text-white shadow-md shadow-[#5da261]/20" 
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"}
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/10">
        {filteredPlayers.length > 0 ? (
          filteredPlayers.map((player) => (
            <DraggablePlayer 
              key={player.id} 
              player={player} 
              disabled={disabled}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[200px] text-slate-400 text-sm italic py-10 text-center px-6">
            <p>Keine Spieler verfügbar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
