/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from "react";
import { 
  DndContext, 
  DragOverlay, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent, 
  DragStartEvent,
  defaultDropAnimationSideEffects,
  useDroppable
} from "@dnd-kit/core";
import { Sidebar } from "./components/Sidebar";
import { Field } from "./components/Field";
import { FORMATIONS, INITIAL_PLAYERS } from "./constants";
import { Formation, Player } from "./types";
import { DraggablePlayer } from "./components/DraggablePlayer";
import { Users, Trophy, User, X, Send, BarChart3, CheckCircle2, Loader2, Award } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  submitVote, 
  getVotes, 
  VoteData, 
  getUserIp, 
  hasAlreadyVoted 
} from "./services/voteService";
import { ImageWithFallback } from "./components/ImageWithFallback";

function CoachSlot({ coach, onRemove }: { coach: Player | null; onRemove: () => void }) {
  const { isOver, setNodeRef } = useDroppable({
    id: "coach-slot",
  });

  return (
    <div 
      ref={setNodeRef}
      className={`
        w-full h-full flex flex-col items-center justify-center relative rounded-2xl
        ${isOver ? "bg-[#5da261]/10 ring-2 ring-[#5da261]" : ""}
      `}
    >
      <AnimatePresence mode="wait">
        {coach ? (
          <motion.div
            key={coach.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center justify-center p-2"
          >
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-1 relative overflow-hidden">
                <ImageWithFallback 
                  src={coach.image || coach.clubLogoUrl} 
                  fallbackSrc={coach.clubFallbackUrl}
                  alt={coach.name}
                  isPortrait={!!coach.image}
                  size={20}
                />
            </div>
            <p className="text-[10px] font-bold text-slate-800 text-center leading-tight">
              {coach.name.split(" ").pop()}
            </p>
            <button
              onClick={onRemove}
              className="absolute -top-1 -right-1 bg-white text-rose-500 rounded-full p-0.5 shadow-md z-10"
            >
              <X size={12} />
            </button>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <User size={20} className="text-slate-300" />
            <span className="text-[10px] font-bold text-slate-300 uppercase">Coach</span>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [formation, setFormation] = useState<Formation>(FORMATIONS[0]);
  const [lineup, setLineup] = useState<Record<string, Player | null>>({});
  const [coach, setCoach] = useState<Player | null>(null);
  const [activePlayer, setActivePlayer] = useState<Player | null>(null);
  
  // Voting and Stats State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [userIp, setUserIp] = useState<string | null>(null);
  const [isCommunityView, setIsCommunityView] = useState(false);
  const [allVotes, setAllVotes] = useState<VoteData[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // Pre-fetch votes and player IP on load
  useEffect(() => {
    getVotes().then(setAllVotes);
    
    // Check if user has already voted by IP
    const initUserData = async () => {
      const ip = await getUserIp();
      setUserIp(ip);
      const voted = await hasAlreadyVoted(ip);
      if (voted) {
        setHasVoted(true);
        // Automatically show community view if they already voted
        setIsCommunityView(true);
      }
    };
    initUserData();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const usedPlayerIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(lineup).forEach((p: Player | null) => p && ids.add(p.id));
    if (coach) ids.add(coach.id);
    return ids;
  }, [lineup, coach]);

  const isLineupComplete = useMemo(() => {
    const playersFilled = Object.values(lineup).filter(p => p !== null).length;
    return playersFilled === 11 && coach !== null;
  }, [lineup, coach]);

  const communityData = useMemo(() => {
    if (allVotes.length === 0) return null;

    // 1. Calculate most popular formation
    const formationCounts: Record<string, number> = {};
    const playerCounts: Record<string, number> = {};
    const coachCounts: Record<string, number> = {};

    allVotes.forEach(vote => {
      // Find formation by looking at slots/keys if we don't store it explicitly?
      // Actually, we should probably have stored formation name. 
      // For now, let's assume the formation is implied by the keys or we just use the most common "distribution"
      // But wait, our vote schema doesn't have formation name. 
      // Let's just pick 4-3-3 as the default "Global Result" display if not known, or pick a standard one.
      // Alternatively, let's pick the TOP 11 players regardless of formation and try to fit them?
      // No, let's use the current "formation" state but populated with top players.
      
      Object.values(vote.lineup).forEach(id => {
        playerCounts[id] = (playerCounts[id] || 0) + 1;
      });
      coachCounts[vote.coachId] = (coachCounts[vote.coachId] || 0) + 1;
    });

    const getTopPlayers = (category: string, count: number) => {
      return INITIAL_PLAYERS
        .filter(p => p.category === category)
        .map(p => ({ player: p, votes: playerCounts[p.id] || 0 }))
        .sort((a, b) => b.votes - a.votes)
        .slice(0, count);
    };

    const topCoach = INITIAL_PLAYERS
      .filter(p => p.category === "Trainer")
      .map(p => ({ player: p, votes: coachCounts[p.id] || 0 }))
      .sort((a, b) => b.votes - a.votes)[0]?.player || null;

    // We'll populate the CURRENT formation with top players
    const communityLineup: Record<string, Player | null> = {};
    const categories: Record<string, number> = {};
    formation.positions.forEach(pos => {
      categories[pos.category] = (categories[pos.category] || 0) + 1;
    });

    Object.entries(categories).forEach(([cat, count]) => {
      const tops = getTopPlayers(cat, count);
      let idx = 0;
      formation.positions.filter(pos => pos.category === cat).forEach(pos => {
        communityLineup[pos.id] = tops[idx]?.player || null;
        idx++;
      });
    });

    return { lineup: communityLineup, coach: topCoach, playerCounts };
  }, [allVotes, formation]);

  const activeLineup = isCommunityView && communityData ? communityData.lineup : lineup;
  const activeCoach = isCommunityView && communityData ? communityData.coach : coach;

  const handleSubmitLineup = () => {
    if (!isLineupComplete || !coach || hasVoted) return;
    
    // 1. Prepare optimistic vote
    const currentVote: VoteData = {
      lineup: Object.fromEntries(
        Object.entries(lineup)
          .filter(([_, p]) => p !== null)
          .map(([slotId, p]) => [slotId, p!.id])
      ),
      coachId: coach.id,
      voterIp: userIp || undefined,
      voterName: "Anonym",
      createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }
    };

    // 2. IMMEDIATE UI TRANSITION
    setHasVoted(true);
    setAllVotes(prev => [...prev, currentVote]);
    setIsCommunityView(true);
    setIsSubmitting(false);

    // 3. Fire-and-forget server sync in background
    submitVote(lineup, coach, userIp || undefined).catch(error => {
      console.error("Background submission failed:", error);
    });
  };

  const handleToggleCommunityView = async () => {
    if (!isCommunityView) {
      setIsStatsLoading(true);
      try {
        const votes = await getVotes();
        setAllVotes(votes);
        setIsCommunityView(true);
      } catch (e) {
        console.error(e);
      } finally {
        setIsStatsLoading(false);
      }
    } else {
      setIsCommunityView(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActivePlayer(active.data.current as Player);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePlayer(null);

    if (!over) return;

    const player = active.data.current as Player;
    const targetId = over.id as string;

    // Handle Coach slot
    if (targetId === "coach-slot") {
      if (player.category === "Trainer") {
        setCoach(player);
      }
      return;
    }

    // Handle Field slots validation
    const targetPosition = formation.positions.find(p => p.id === targetId);
    if (targetPosition && targetPosition.category !== player.category) {
      return;
    }

    setLineup(prev => ({
      ...prev,
      [targetId]: player
    }));
  };

  const removePlayer = (slotId: string) => {
    setLineup(prev => {
      const newLineup = { ...prev };
      delete newLineup[slotId];
      return newLineup;
    });
  };

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col lg:flex-row h-screen w-full bg-slate-100 overflow-hidden font-sans">
        {/* Main Content (Pitch) */}
        <main className="flex-1 flex flex-col min-w-0 bg-white shadow-inner">
          {/* Header */}
          <header className="px-6 py-2 border-b border-slate-100 flex items-center justify-between bg-white z-20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#5da261] rounded-lg flex items-center justify-center text-white shadow-lg shadow-[#5da261]/20">
                <Trophy size={16} />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-slate-800 leading-tight">Eleven Master</h1>
                <p className="text-[10px] text-slate-500 font-medium italic">Wähle dein Team der Saison</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden md:flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                {FORMATIONS.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => {
                      setFormation(f);
                      setLineup({}); 
                    }}
                    className={`
                      px-2 py-1 rounded-md text-[10px] font-bold transition-all
                      ${formation.name === f.name 
                        ? "bg-white text-[#5da261] shadow-sm ring-1 ring-slate-200" 
                        : "text-slate-400 hover:text-slate-600"}
                    `}
                  >
                    {f.name}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleToggleCommunityView}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all justify-center
                    ${isCommunityView 
                      ? "bg-slate-800 text-white" 
                      : "bg-blue-600/10 text-blue-600 hover:bg-blue-600/20"}
                  `}
                >
                  {isStatsLoading ? <Loader2 size={12} className="animate-spin" /> : <BarChart3 size={12} />}
                  <span className="hidden xs:inline">{isCommunityView ? "Wahl" : "Stats"}</span>
                </button>

                {!isCommunityView && (
                  <button 
                    disabled={!isLineupComplete || isSubmitting || hasVoted}
                    onClick={handleSubmitLineup}
                    className={`
                      flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all justify-center
                      ${!isLineupComplete || isSubmitting || hasVoted
                        ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                        : "bg-[#5da261] text-white shadow-lg shadow-[#5da261]/20 hover:scale-105"}
                    `}
                  >
                    {isSubmitting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <>
                        {hasVoted ? <CheckCircle2 size={12} /> : <Send size={12} />}
                        <span>{hasVoted ? "Abgegeben" : "Senden"}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-hidden bg-slate-50/50 flex flex-col items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-4xl h-full flex flex-col items-center justify-center gap-4">
              <div className="w-full max-w-lg relative flex-1 flex flex-col justify-center min-h-0">
                {isCommunityView && (
                  <div className="absolute -top-10 left-0 right-0 text-center flex flex-col gap-0.5 z-10">
                    <span className="bg-[#5da261] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg inline-block mx-auto">
                      Community Team der Saison
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold italic">
                      Basierend auf {allVotes.length} Stimmen
                    </span>
                  </div>
                )}
                <motion.div
                  key={formation.name + (isCommunityView ? "-community" : "-personal")}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative h-full flex flex-col justify-center"
                >
                  <div className="max-h-[70vh] aspect-[2/3] mx-auto w-full flex items-center justify-center">
                    <Field 
                      formation={formation} 
                      lineup={activeLineup} 
                      onRemove={(isCommunityView || hasVoted) ? undefined : removePlayer} 
                      activePlayer={activePlayer}
                      playerVotes={isCommunityView ? communityData?.playerCounts : undefined}
                    />
                  </div>

                  {/* Coach Area */}
                  <div className="mt-1 lg:absolute lg:top-1/2 lg:-left-24 lg:-translate-y-1/2 lg:mt-0 flex flex-col items-center gap-1 z-10">
                     <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
                      Trainer
                    </div>
                    <div
                      className={`
                        w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-slate-200 
                        flex flex-col items-center justify-center gap-0.5 transition-all relative
                        ${activeCoach ? "border-solid bg-white shadow-md" : "bg-slate-50 hover:border-[#5da261]/30"}
                      `}
                    >
                      <CoachSlot 
                        coach={activeCoach} 
                        onRemove={(isCommunityView || hasVoted) ? () => {} : () => setCoach(null)} 
                      />
                      {isCommunityView && communityData && activeCoach && (
                         <div className="absolute -bottom-2 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                           {communityData.playerCounts[activeCoach.id] || 0}
                         </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </main>

        {/* Sidebar (Right) */}
        <Sidebar 
          players={players} 
          usedPlayerIds={usedPlayerIds} 
          disabled={hasVoted}
        />

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: "0.5",
              },
            },
          }),
        }}>
          {activePlayer && (
            <div className="scale-105 rotate-3 transition-transform">
              <DraggablePlayer player={activePlayer} isOverlay />
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
