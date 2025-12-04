import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Player, Territory, UnitType, PlayerId, LogEntry } from './types';
import { MAP_POSITIONS, EDGES, COLORS } from './constants';
import { UnitIcon } from './components/UnitIcon';
import { 
  Shield, 
  Swords, 
  Users, 
  ArrowRight, 
  RefreshCcw, 
  MapPin, 
  Play, 
  Activity, 
  AlertTriangle,
  Trophy,
  Skull,
  Settings,
  Zap,
  ScrollText,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// --- GAME LOGIC HELPERS ---

const rollDice = () => Math.floor(Math.random() * 6) + 1;

const getTotalPower = (t: Territory) => t.troops.peon + (t.troops.horse * 5) + (t.troops.tank * 10);

const createInitialState = (vsAI: boolean, catastropheInterval: number): GameState => {
  const territories: Record<string, Territory> = {};
  Object.keys(MAP_POSITIONS).forEach(node => {
    territories[node] = {
      id: node,
      owner: null,
      troops: { peon: 0, horse: 0, tank: 0 }
    };
  });

  return {
    territories,
    players: [
      { id: 1, name: 'Player Blue', color: COLORS.p1, isAi: false, capital: null, movRest: 0, isAlive: true },
      { id: 2, name: vsAI ? 'The Machine' : 'Player Red', color: COLORS.p2, isAi: vsAI, capital: null, movRest: 0, isAlive: true }
    ],
    turnCount: 0,
    roundCount: 1,
    currentPlayerIndex: 0,
    catastropheInterval: catastropheInterval,
    logs: [{ id: 'init', text: 'Welcome. Phase 1: Establish Capital.', type: 'info', timestamp: Date.now() }],
    winner: null,
    selectedNode: null,
    isProcessing: false
  };
};

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  
  // Interaction State
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [configInterval, setConfigInterval] = useState(5);
  
  // UI State
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [moveMenu, setMoveMenu] = useState<{from: string, to: string, types: UnitType[]} | null>(null);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // --- LOGGING ---
  const addLog = (text: string, type: LogEntry['type'] = 'info') => {
    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        logs: [...prev.logs, { id: Date.now().toString(), text, type, timestamp: Date.now() }]
      };
    });
  };

  // Scroll to bottom of logs when opened or updated
  useEffect(() => {
    if (isLogOpen && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameState?.logs, isLogOpen]);

  // --- ACTIONS ---

  const endTurn = useCallback(() => {
    setGameState(prev => {
      if (!prev) return null;
      let nextIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      let nextRound = prev.roundCount;
      let nextTurn = prev.turnCount + 1;
      
      if (nextIndex === 0) {
        nextRound += 1;
      }

      if (prev.turnCount >= 2) {
          let safetyCounter = 0;
          while (!prev.players[nextIndex].isAlive && safetyCounter < prev.players.length) {
             nextIndex = (nextIndex + 1) % prev.players.length;
             if (nextIndex === 0) nextRound += 1;
             safetyCounter++;
          }
      }

      return {
        ...prev,
        currentPlayerIndex: nextIndex,
        roundCount: nextRound,
        turnCount: nextTurn,
        isProcessing: false,
        players: prev.players.map((p, idx) => ({
          ...p,
          movRest: idx === nextIndex && p.movRest > 0 ? p.movRest - 1 : p.movRest
        }))
      };
    });
  }, []);

  // --- MECHANICS ---

  const applyDamage = (t: Territory, dmg: number) => {
    let damage = dmg;
    const newTroops = { ...t.troops };

    while (damage > 0 && (newTroops.peon > 0 || newTroops.horse > 0 || newTroops.tank > 0)) {
      if (newTroops.peon > 0) {
        newTroops.peon--;
        damage--;
      } else if (newTroops.horse > 0) {
        newTroops.horse--;
        newTroops.peon += 5;
      } else if (newTroops.tank > 0) {
        newTroops.tank--;
        newTroops.horse += 2;
      }
    }
    
    const remainingPower = newTroops.peon + newTroops.horse * 5 + newTroops.tank * 10;
    const newOwner = remainingPower <= 0 ? null : t.owner;
    if (remainingPower <= 0) {
        newTroops.peon = 0; newTroops.horse = 0; newTroops.tank = 0;
    }

    return { troops: newTroops, owner: newOwner };
  };

  const handleCombat = (attackerId: string, defenderId: string) => {
    if (!gameState) return;
    
    const att = gameState.territories[attackerId];
    const def = gameState.territories[defenderId];
    const player = gameState.players[gameState.currentPlayerIndex];

    const r1 = rollDice();
    const b1 = rollDice();

    let newDef = { ...def };
    let newAtt = { ...att };

    addLog(`⚔️ Combat at ${defenderId}: ${r1} (Att) vs ${b1} (Def)`, 'combat');

    if (r1 > b1) {
      const dmg = r1 - b1;
      const res = applyDamage(newDef, dmg);
      newDef.troops = res.troops;
      newDef.owner = res.owner;
      addLog(`💥 Hit! Defender took ${dmg} damage.`, 'combat');
    } else {
        addLog(`🛡️ Blocked by defender.`, 'combat');
    }

    if (getTotalPower(newDef) > 0) {
      const r2 = rollDice();
      const b2 = rollDice();
      
      if (r2 > b2) {
        const dmg = r2 - b2;
        const res = applyDamage(newAtt, dmg);
        newAtt.troops = res.troops;
        newAtt.owner = res.owner;
        addLog(`🗡️ Counter-hit! Attacker took ${dmg} damage.`, 'combat');
      }
    } else {
        addLog(`🏳️ Defender neutralized!`, 'info');
    }

    setGameState(prev => {
        if(!prev) return null;
        return {
            ...prev,
            territories: {
                ...prev.territories,
                [attackerId]: newAtt,
                [defenderId]: newDef
            },
            players: prev.players.map(p => p.id === player.id ? { ...p, movRest: 1 } : p)
        }
    });
    endTurn();
  };

  const handleMove = (fromId: string, toId: string, unitType: UnitType) => {
    if (!gameState) return;
    const player = gameState.players[gameState.currentPlayerIndex];
    
    setGameState(prev => {
        if (!prev) return null;
        const fromT = { ...prev.territories[fromId] };
        const toT = { ...prev.territories[toId] };

        if (fromT.troops[unitType] <= 0) return prev;

        fromT.troops[unitType]--;
        if (getTotalPower(fromT) === 0) fromT.owner = null;

        if (toT.owner === null) {
            toT.owner = player.id;
        }
        toT.troops[unitType]++;

        return {
            ...prev,
            territories: {
                ...prev.territories,
                [fromId]: fromT,
                [toId]: toT
            },
            players: prev.players.map(p => p.id === player.id ? { ...p, movRest: 1 } : p)
        };
    });
    addLog(`Moved ${unitType} to ${toId}`);
    endTurn();
  };

  const checkVictory = useCallback(() => {
    if (!gameState) return;
    if (gameState.turnCount < 2) return;

    let activePlayers = 0;
    const newPlayers = gameState.players.map(p => {
        if (!p.isAlive) return p;
        if (p.capital) {
            const capTerr = gameState.territories[p.capital];
            if (capTerr.owner === p.id && getTotalPower(capTerr) > 0) {
                return p;
            }
        }
        return { ...p, isAlive: false, capital: null };
    });

    activePlayers = newPlayers.filter(p => p.isAlive).length;

    if (JSON.stringify(newPlayers) !== JSON.stringify(gameState.players)) {
        setGameState(prev => prev ? { ...prev, players: newPlayers } : null);
        addLog("👑 A capital has fallen!", "event");
    }

    if (activePlayers <= 1 && gameState.players.length > 0) {
        const winner = newPlayers.find(p => p.isAlive);
        setGameState(prev => prev ? { ...prev, winner: winner ? winner.id : 'draw' } : null);
    }

  }, [gameState]);

  // --- CATASTROPHE ---
  useEffect(() => {
    if (!gameState || gameState.winner) return;
  }, [gameState?.roundCount]);
  
  const triggerCatastrophe = () => {
      if (!gameState) return;
      
      addLog(`⚡ Catastrophe Event (Round ${gameState.roundCount})`, 'event');
      
      let newTerritories = { ...gameState.territories };

      gameState.players.forEach(p => {
          if (!p.isAlive || !p.capital || newTerritories[p.capital].owner !== p.id) return;

          const dr = rollDice() + rollDice();
          const db = rollDice() + rollDice();
          
          if (dr > db) {
              let loss = dr - db;
              addLog(`${p.name}: Plague! Losing ${loss} power.`, 'event');
              let attempts = 0;
              while (loss > 0 && attempts < 50) {
                  const pTerrs = Object.values(newTerritories).filter(t => t.owner === p.id && getTotalPower(t) > 0);
                  if (pTerrs.length === 0) break;
                  const target = pTerrs[Math.floor(Math.random() * pTerrs.length)];
                  const res = applyDamage(target, 1);
                  newTerritories[target.id] = { ...target, ...res };
                  loss--;
                  attempts++;
              }
          } else if (db > dr) {
              const gain = db - dr;
              addLog(`${p.name}: Prosperity! +${gain} Peons in Capital.`, 'event');
              newTerritories[p.capital].troops.peon += gain;
          } else {
            addLog(`${p.name}: No change.`, 'event');
          }
      });

      setGameState(prev => prev ? { ...prev, territories: newTerritories } : null);
  };
  
  const prevRoundRef = useRef(1);
  useEffect(() => {
      if (gameState && gameState.roundCount > prevRoundRef.current) {
          if (gameState.roundCount > 1 && (gameState.roundCount - 1) % gameState.catastropheInterval === 0) {
              setTimeout(() => triggerCatastrophe(), 500);
          }
          prevRoundRef.current = gameState.roundCount;
      }
      checkVictory();
  }, [gameState?.roundCount, gameState?.turnCount]);


  // --- AI ---
  useEffect(() => {
    if (!gameState || gameState.winner) return;
    const player = gameState.players[gameState.currentPlayerIndex];
    
    if (player.isAi && !gameState.isProcessing) {
        
        // --- AI SETUP ---
        if (gameState.turnCount < 2 && !player.capital) {
             setGameState(prev => prev ? { ...prev, isProcessing: true } : null);
             setTimeout(() => {
                 const availableNodes = Object.values(gameState.territories).filter(t => t.owner === null);
                 if (availableNodes.length > 0) {
                     const pick = availableNodes[Math.floor(Math.random() * availableNodes.length)];
                     setGameState(prev => {
                        if (!prev) return null;
                        const t = { ...prev.territories[pick.id], owner: player.id, troops: { peon: 5, horse: 1, tank: 0 } };
                        const p = { ...player, capital: pick.id };
                        return {
                            ...prev,
                            territories: { ...prev.territories, [pick.id]: t },
                            players: prev.players.map(pl => pl.id === player.id ? p : pl),
                            isProcessing: false
                        };
                     });
                     addLog(`${player.name} selected Capital ${pick.id}`);
                     endTurn();
                 }
             }, 1500);
             return;
        }

        if (!player.isAlive) {
            endTurn();
            return;
        }

        if (player.movRest > 0) {
            setTimeout(() => {
                addLog("AI Resting...", 'info');
                endTurn();
            }, 1000);
            return;
        }

        setGameState(prev => prev ? { ...prev, isProcessing: true } : null);

        setTimeout(() => {
            if (!player.capital || gameState.territories[player.capital].owner !== player.id) {
                 endTurn();
                 return;
            }

            const myNodes = Object.values(gameState.territories).filter(t => t.owner === player.id);
            const capTerr = gameState.territories[player.capital];
            
            if (getTotalPower(capTerr) < 5) {
                setGameState(prev => {
                    if(!prev) return null;
                    const t = { ...prev.territories[player.capital!] };
                    t.troops.peon += 1;
                    return { ...prev, territories: { ...prev.territories, [player.capital!]: t }, players: prev.players.map(p => p.id === player.id ? {...p, movRest: 1} : p) };
                });
                addLog("AI Recruited at Capital", 'info');
                endTurn();
                return;
            }

            let bestMove = { from: '', to: '', score: -1, type: 'none' };
            
            myNodes.forEach(node => {
                if (getTotalPower(node) < 1) return;
                
                const neighbors = EDGES.filter(e => e.includes(node.id)).map(e => e[0] === node.id ? e[1] : e[0]);
                neighbors.forEach(nId => {
                    const nTerr = gameState.territories[nId];
                    
                    if (nTerr.owner === null) {
                        if (10 > bestMove.score) bestMove = { from: node.id, to: nId, score: 10, type: 'move' };
                    } else if (nTerr.owner !== player.id) {
                        if (getTotalPower(node) > getTotalPower(nTerr) + 2) {
                            if (8 > bestMove.score) bestMove = { from: node.id, to: nId, score: 8, type: 'attack' };
                        }
                    } else {
                         if (3 > bestMove.score && Math.random() > 0.7) bestMove = { from: node.id, to: nId, score: 3, type: 'move' };
                    }
                });
            });

            if (bestMove.type === 'move') {
                const fT = gameState.territories[bestMove.from];
                const uType: UnitType = fT.troops.peon > 0 ? 'peon' : (fT.troops.horse > 0 ? 'horse' : 'tank');
                handleMove(bestMove.from, bestMove.to, uType);
            } else if (bestMove.type === 'attack') {
                handleCombat(bestMove.from, bestMove.to);
            } else {
                setGameState(prev => {
                    if(!prev) return null;
                    const t = { ...prev.territories[player.capital!] };
                    t.troops.peon += 1;
                    return { ...prev, territories: { ...prev.territories, [player.capital!]: t }, players: prev.players.map(p => p.id === player.id ? {...p, movRest: 1} : p) };
                });
                addLog("AI Recruited (Idle)", 'info');
                endTurn();
            }

        }, 1000);
    }
  }, [gameState?.currentPlayerIndex, gameState?.isProcessing, gameState?.winner, gameState?.turnCount]);


  // --- INTERACTION ---

  const handleNodeClick = (nodeId: string) => {
    if (!gameState) return;
    const player = gameState.players[gameState.currentPlayerIndex];
    
    if (gameState.turnCount < 2 && !player.isAi) {
        if (gameState.territories[nodeId].owner === null) {
             setGameState(prev => {
                 if(!prev) return null;
                 const t = { ...prev.territories[nodeId], owner: player.id, troops: { peon: 5, horse: 1, tank: 0 } };
                 const p = { ...player, capital: nodeId };
                 const updatedPlayers = prev.players.map(pl => pl.id === player.id ? p : pl);
                 return {
                     ...prev,
                     territories: { ...prev.territories, [nodeId]: t },
                     players: updatedPlayers
                 };
             });
             addLog(`${player.name} selected Capital ${nodeId}`);
             endTurn();
        } else {
            addLog("Node occupied!", 'error');
        }
        return;
    }

    if (gameState.turnCount >= 2 && !player.isAi) {
        setGameState(prev => prev ? { ...prev, selectedNode: nodeId === prev.selectedNode ? null : nodeId } : null);
    }
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, nodeId: string) => {
    if (!gameState || gameState.winner || gameState.isProcessing) return;
    const player = gameState.players[gameState.currentPlayerIndex];
    if (gameState.territories[nodeId].owner !== player.id) return;
    if (getTotalPower(gameState.territories[nodeId]) <= 0) return;
    if (player.movRest > 0) return;

    setDragStart(nodeId);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragStart || !svgRef.current) return;
    
    const point = svgRef.current.createSVGPoint();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    point.x = clientX;
    point.y = clientY;
    const svgPoint = point.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
    
    setMousePos({ x: svgPoint.x, y: svgPoint.y });
  };

  const handleDragEnd = () => {
    if (dragStart && dragEnd && dragStart !== dragEnd) {
       const isAdjacent = EDGES.some(e => (e[0] === dragStart && e[1] === dragEnd) || (e[0] === dragEnd && e[1] === dragStart));
       if (isAdjacent) {
           const target = gameState!.territories[dragEnd];
           const source = gameState!.territories[dragStart];
           const player = gameState!.players[gameState!.currentPlayerIndex];

           if (target.owner !== null && target.owner !== player.id) {
               handleCombat(dragStart, dragEnd);
           } else {
               // Determine available unit types
               const types: UnitType[] = [];
               if (source.troops.peon > 0) types.push('peon');
               if (source.troops.horse > 0) types.push('horse');
               if (source.troops.tank > 0) types.push('tank');

               if (types.length === 1) {
                   handleMove(dragStart, dragEnd, types[0]);
               } else if (types.length > 1) {
                   setMoveMenu({ from: dragStart, to: dragEnd, types });
               }
           }
       }
    }
    setDragStart(null);
    setDragEnd(null);
  };

  // Buttons handlers
  const recruit = () => {
      if (!gameState) return;
      const player = gameState.players[gameState.currentPlayerIndex];
      if (player.capital && gameState.territories[player.capital].owner === player.id) {
           setGameState(prev => {
                if(!prev) return null;
                const t = { ...prev.territories[player.capital!] };
                t.troops.peon += 1;
                return { 
                    ...prev, 
                    territories: { ...prev.territories, [player.capital!]: t },
                    players: prev.players.map(p => p.id === player.id ? { ...p, movRest: 1 } : p)
                };
            });
            addLog("Recruited reinforcement");
            endTurn();
      }
  };

  const fuse = (type: 'A' | 'B' | 'C') => {
      if (!gameState || !gameState.selectedNode) return;
      const tId = gameState.selectedNode;
      const player = gameState.players[gameState.currentPlayerIndex];
      const t = gameState.territories[tId];

      if (t.owner !== player.id) return;

      let success = false;
      let newT = { ...t };

      if (type === 'A' && t.troops.peon >= 5) { // 5P -> 1H
          newT.troops.peon -= 5; newT.troops.horse += 1; success = true;
      } else if (type === 'B' && t.troops.horse >= 2) { // 2H -> 1T
          newT.troops.horse -= 2; newT.troops.tank += 1; success = true;
      } else if (type === 'C' && t.troops.peon >= 10) { // 10P -> 1T
          newT.troops.peon -= 10; newT.troops.tank += 1; success = true;
      }

      if (success) {
          setGameState(prev => prev ? {
              ...prev,
              territories: { ...prev.territories, [tId]: newT },
              players: prev.players.map(p => p.id === player.id ? { ...p, movRest: 1 } : p)
          } : null);
          addLog("Fusion successful.");
          endTurn();
      } else {
          addLog("Insufficient troops for fusion.", 'error');
      }
  };

  const moveCapital = () => {
      if (!gameState || !gameState.selectedNode) return;
      const player = gameState.players[gameState.currentPlayerIndex];
      const t = gameState.territories[gameState.selectedNode];
      
      // Check if another player has a capital here
      const isExistingCapital = gameState.players.some(p => p.capital === t.id && p.id !== player.id);

      if (isExistingCapital) {
          addLog("Cannot move capital to an enemy capital site.", 'error');
          return;
      }

      if (t.owner === player.id && getTotalPower(t) >= 10) {
          setGameState(prev => prev ? {
              ...prev,
              players: prev.players.map(p => p.id === player.id ? { ...p, capital: t.id, movRest: 3 } : p)
          } : null);
          addLog("Capital moved to " + t.id);
          endTurn();
      } else {
          addLog("Need 10+ Power to move Capital.", 'error');
      }
  };

  const startGame = (vsAi: boolean) => {
      setGameState(createInitialState(vsAi, configInterval));
  };


  // --- RENDER ---
  
  if (!gameState) {
      return (
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800 font-light select-none">
              <div className="text-4xl font-bold mb-4 tracking-tight text-slate-800">GRAPH WARS</div>
              <div className="text-sm mb-12 text-slate-500 uppercase tracking-widest">Metro Tactics</div>
              
              <div className="mb-12 w-64">
                  <div className="flex justify-between text-xs text-slate-500 mb-2 uppercase tracking-wide">
                      <span className="flex items-center gap-1"><Zap size={12}/> Catastrophes</span>
                      <span className="font-bold text-slate-700">Every {configInterval} Rounds</span>
                  </div>
                  <input 
                    type="range" 
                    min="3" 
                    max="15" 
                    value={configInterval} 
                    onChange={(e) => setConfigInterval(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Frequent</span>
                      <span>Rare</span>
                  </div>
              </div>

              <div className="flex gap-4">
                  <button onClick={() => startGame(false)} className="px-8 py-3 bg-white border border-slate-200 shadow-sm hover:shadow-md rounded-full transition flex items-center gap-2 group">
                      <Users size={18} className="text-slate-400 group-hover:text-slate-600"/> PvP
                  </button>
                  <button onClick={() => startGame(true)} className="px-8 py-3 bg-slate-800 text-white shadow-lg hover:bg-slate-700 rounded-full transition flex items-center gap-2">
                      <Activity size={18} /> PvE (Vs AI)
                  </button>
              </div>
          </div>
      );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = !currentPlayer.isAi && !gameState.winner && !gameState.isProcessing && currentPlayer.movRest === 0;

  return (
    <div className="h-screen w-screen bg-[#f3f4f6] relative overflow-hidden select-none"
         onMouseMove={handleDragMove}
         onTouchMove={handleDragMove}
         onMouseUp={handleDragEnd}
         onTouchEnd={handleDragEnd}
    >
      {/* MAP SVG */}
      <svg 
        ref={svgRef}
        viewBox="0 0 1000 600" 
        preserveAspectRatio="xMidYMid meet" 
        className="w-full h-full absolute top-0 left-0 touch-none"
      >
        {/* Edges */}
        {EDGES.map(([a, b], idx) => {
            const p1 = MAP_POSITIONS[a];
            const p2 = MAP_POSITIONS[b];
            return (
                <line 
                    key={`${a}-${b}`} 
                    x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} 
                    stroke="#cbd5e1" 
                    strokeWidth="4" 
                    strokeLinecap="round"
                />
            );
        })}

        {/* Drag Line */}
        {dragStart && (
            <line 
                x1={MAP_POSITIONS[dragStart].x} 
                y1={MAP_POSITIONS[dragStart].y}
                x2={mousePos.x}
                y2={mousePos.y}
                stroke={gameState.players[gameState.currentPlayerIndex].color}
                strokeWidth="6"
                strokeDasharray="10,10"
                strokeLinecap="round"
                className="opacity-60"
            />
        )}

        {/* Nodes */}
        {Object.entries(gameState.territories).map(([id, t]) => {
            const pos = MAP_POSITIONS[id];
            const owner = t.owner ? gameState.players.find(p => p.id === t.owner) : null;
            const isCapital = gameState.players.some(p => p.capital === id && p.isAlive);
            const isSelected = gameState.selectedNode === id;
            const power = getTotalPower(t);
            const size = 20 + Math.min(power, 20); // Dynamic size based on power
            
            // Interaction handlers
            const handleEnter = () => dragStart && setDragEnd(id);
            const handleLeave = () => dragStart && dragEnd === id && setDragEnd(null);

            return (
                <g key={id} 
                   transform={`translate(${pos.x}, ${pos.y})`}
                   className="transition-all duration-300 ease-out cursor-pointer"
                   onMouseDown={(e) => { handleNodeClick(id); handleDragStart(e, id); }}
                   onTouchStart={(e) => { handleNodeClick(id); handleDragStart(e, id); }}
                   onMouseEnter={handleEnter}
                   onMouseLeave={handleLeave}
                >
                    {/* Hover area extender */}
                    <circle r={size + 15} fill="transparent" />
                    
                    {/* Node Body */}
                    <circle 
                        r={size} 
                        fill={owner ? owner.color : COLORS.bg} 
                        stroke={owner ? (owner.id === 1 ? COLORS.p1 : COLORS.p2) : '#9ca3af'}
                        strokeWidth={isSelected ? 6 : 4}
                        className="transition-all duration-300"
                    />

                    {/* Capital Indicator */}
                    {isCapital && (
                        <circle r={size + 8} fill="none" stroke={owner?.color} strokeWidth="2" strokeDasharray="4,4" className="animate-spin-slow" />
                    )}

                    {/* Unit Icons */}
                    <g transform="translate(-8, -8)">
                        {t.troops.tank > 0 ? (
                           <UnitIcon type="tank" color={owner ? '#fff' : '#666'} size={16} />
                        ) : t.troops.horse > 0 ? (
                           <UnitIcon type="horse" color={owner ? '#fff' : '#666'} size={16} />
                        ) : t.troops.peon > 0 ? (
                           <UnitIcon type="peon" color={owner ? '#fff' : '#666'} size={16} />
                        ) : null}
                    </g>
                    
                    {/* Node ID */}
                    <text 
                        y={-size - 8} 
                        textAnchor="middle" 
                        className="text-[12px] font-bold fill-slate-400 select-none pointer-events-none opacity-50 uppercase"
                    >
                        {id}
                    </text>
                    
                    {/* Count Text */}
                    {power > 0 && (
                        <text y={size + 15} textAnchor="middle" className="text-[10px] font-bold fill-slate-500 select-none pointer-events-none">
                            {power}
                        </text>
                    )}
                </g>
            );
        })}
      </svg>

      {/* HUD - TOP BAR */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none">
          <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-white/50 pointer-events-auto">
              <div className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1">Current Turn</div>
              <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${currentPlayer.id === 1 ? 'bg-blue-500' : 'bg-rose-500'}`} />
                  <span className="font-semibold text-slate-800">{currentPlayer.name}</span>
                  {currentPlayer.movRest > 0 && <span className="text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-600">Resting ({currentPlayer.movRest})</span>}
              </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-white/50 text-right">
             <div className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1">Status</div>
             <div className="flex items-center justify-end gap-3 text-sm text-slate-600">
                 <span>R: {gameState.roundCount}</span>
                 <span className="text-slate-300">|</span>
                 <span>Catastrophe in: {gameState.catastropheInterval - ((gameState.roundCount - 1) % gameState.catastropheInterval)}</span>
             </div>
          </div>
      </div>

      {/* NODE INSPECTOR (Expanded Action Bar) */}
      {gameState.selectedNode && gameState.territories[gameState.selectedNode] && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto animate-fade-in-up flex flex-col items-center gap-2">
              
              {/* Info Card */}
              <div className="bg-white/90 backdrop-blur-lg px-6 py-3 rounded-2xl shadow-xl border border-white/50 flex gap-6 items-center">
                   <div className="text-left">
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Node</div>
                       <div className="text-xl font-bold text-slate-800">{gameState.selectedNode}</div>
                   </div>
                   <div className="w-px h-8 bg-slate-200"></div>
                   <div className="flex gap-4">
                       <div className="flex flex-col items-center">
                           <UnitIcon type="peon" color="#64748b" size={14} />
                           <span className="text-sm font-semibold text-slate-700">{gameState.territories[gameState.selectedNode].troops.peon}</span>
                       </div>
                       <div className="flex flex-col items-center">
                           <UnitIcon type="horse" color="#64748b" size={14} />
                           <span className="text-sm font-semibold text-slate-700">{gameState.territories[gameState.selectedNode].troops.horse}</span>
                       </div>
                       <div className="flex flex-col items-center">
                           <UnitIcon type="tank" color="#64748b" size={14} />
                           <span className="text-sm font-semibold text-slate-700">{gameState.territories[gameState.selectedNode].troops.tank}</span>
                       </div>
                   </div>
              </div>

              {/* Actions (Only if owner) */}
              {gameState.territories[gameState.selectedNode].owner === currentPlayer.id && isMyTurn && (
                  <div className="bg-white/90 backdrop-blur-lg p-2 rounded-2xl shadow-xl border border-white/50 flex gap-2">
                    <button onClick={recruit} disabled={gameState.selectedNode !== currentPlayer.capital} className="flex flex-col items-center justify-center w-14 h-14 rounded-xl hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-700">
                        <Users size={18} className="mb-1" />
                        <span className="text-[9px] font-medium">Recruit</span>
                    </button>
                    <div className="w-px bg-slate-200 my-2"></div>
                    <button onClick={() => fuse('A')} className="flex flex-col items-center justify-center w-14 h-14 rounded-xl hover:bg-slate-100 disabled:opacity-30 transition text-slate-700">
                        <div className="flex text-[9px] mb-1"><UnitIcon type="peon" color="#334155" size={10} />x5</div>
                        <span className="text-[9px] font-medium">Fuse H</span>
                    </button>
                    <button onClick={() => fuse('B')} className="flex flex-col items-center justify-center w-14 h-14 rounded-xl hover:bg-slate-100 disabled:opacity-30 transition text-slate-700">
                        <div className="flex text-[9px] mb-1"><UnitIcon type="horse" color="#334155" size={10} />x2</div>
                        <span className="text-[9px] font-medium">Fuse T</span>
                    </button>
                    <div className="w-px bg-slate-200 my-2"></div>
                    <button onClick={moveCapital} className="flex flex-col items-center justify-center w-14 h-14 rounded-xl hover:bg-slate-100 disabled:opacity-30 transition text-slate-700">
                        <MapPin size={18} className="mb-1" />
                        <span className="text-[9px] font-medium">Set Cap</span>
                    </button>
                </div>
              )}
          </div>
      )}

      {/* UNIT SELECTOR MODAL */}
      {moveMenu && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
              <div className="bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 animate-fade-in-up">
                  <h3 className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Select Unit to Move</h3>
                  <div className="flex gap-4">
                      {moveMenu.types.map(type => (
                          <button 
                              key={type}
                              onClick={() => { handleMove(moveMenu.from, moveMenu.to, type); setMoveMenu(null); }}
                              className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 transition group"
                          >
                              <UnitIcon type={type} color="currentColor" size={24} className="text-slate-600 group-hover:text-blue-500 mb-2"/>
                              <span className="text-xs font-semibold capitalize">{type}</span>
                          </button>
                      ))}
                  </div>
                  <button onClick={() => setMoveMenu(null)} className="mt-4 w-full py-2 text-slate-400 hover:text-slate-600 text-xs font-medium">Cancel</button>
              </div>
          </div>
      )}

      {/* LOGS BUTTON & PANEL */}
      <div className={`absolute left-0 bottom-0 top-0 transition-all duration-300 ease-in-out z-40 flex pointer-events-none ${isLogOpen ? 'w-80' : 'w-16'}`}>
          <div className={`h-full bg-white/90 backdrop-blur-md shadow-2xl border-r border-white/50 flex flex-col transition-all duration-300 pointer-events-auto ${isLogOpen ? 'w-80' : 'w-0 overflow-hidden opacity-0'}`}>
               <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                   <span className="font-bold text-slate-700 flex items-center gap-2"><ScrollText size={16}/> Event Log</span>
                   <button onClick={() => setIsLogOpen(false)} className="p-1 hover:bg-slate-100 rounded-full"><X size={16} className="text-slate-400"/></button>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-3">
                   {gameState.logs.map((log) => (
                       <div key={log.id} className={`text-xs p-2 rounded border-l-2 ${
                          log.type === 'combat' ? 'border-red-400 bg-red-50 text-red-900' : 
                          log.type === 'event' ? 'border-amber-400 bg-amber-50 text-amber-900' : 
                          log.type === 'error' ? 'border-rose-600 bg-rose-50 text-rose-900' :
                          'border-blue-400 bg-blue-50 text-slate-700'
                       }`}>
                           <div className="opacity-50 text-[10px] mb-1">{new Date(log.timestamp).toLocaleTimeString()}</div>
                           {log.text}
                       </div>
                   ))}
                   <div ref={logsEndRef} />
               </div>
          </div>
          
          {/* Toggle Button */}
          <div className="absolute bottom-4 left-4 pointer-events-auto">
             {!isLogOpen && (
                 <button onClick={() => setIsLogOpen(true)} className="w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-slate-600 hover:text-blue-600 transition">
                     <ScrollText size={20} />
                 </button>
             )}
          </div>
      </div>

      {/* WINNER OVERLAY */}
      {gameState.winner && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-3xl shadow-2xl text-center border border-slate-100 max-w-sm">
                  {gameState.winner === 'draw' ? (
                      <Skull size={48} className="mx-auto text-gray-500 mb-4" />
                  ) : (
                      <Trophy size={48} className="mx-auto text-yellow-500 mb-4" />
                  )}
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                      {gameState.winner === 'draw' ? 'Total Annihilation' : `${gameState.players.find(p => p.id === gameState.winner)?.name} Wins!`}
                  </h2>
                  <p className="text-slate-500 mb-6">
                      Rounds: {gameState.roundCount}
                  </p>
                  <button onClick={() => setGameState(null)} className="px-6 py-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition flex items-center gap-2 mx-auto">
                      <RefreshCcw size={16} /> Play Again
                  </button>
              </div>
          </div>
      )}
      
      {/* INITIAL INSTRUCTION OVERLAY */}
      {gameState.turnCount < 2 && !gameState.winner && !currentPlayer.isAi && (
          <div className="absolute top-20 w-full text-center pointer-events-none">
              <div className="inline-block bg-slate-800/90 text-white px-4 py-2 rounded-full text-sm font-medium animate-bounce shadow-lg">
                  {currentPlayer.name}, select a white node to establish your Capital
              </div>
          </div>
      )}
    </div>
  );
}
