import React, { useEffect, useState } from 'react';
import { Swords, Zap, Skull, TrendingUp, Shield, Activity } from 'lucide-react';

export interface CombatResult {
    attackerName: string;
    defenderName: string;
    attackerRoll: number;
    defenderRoll: number;
    damageDealt: number;
    isCounter: boolean;
    location: string;
}

export interface CatastropheResult {
    round: number;
    details: {
        playerId: number;
        playerName: string;
        type: 'plague' | 'prosperity' | 'neutral';
        amount: number;
    }[];
}

interface AnnouncementOverlayProps {
    type: 'combat' | 'catastrophe' | null;
    combatData?: CombatResult;
    catastropheData?: CatastropheResult;
    onClose: () => void;
}

export const AnnouncementOverlay: React.FC<AnnouncementOverlayProps> = ({ type, combatData, catastropheData, onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (type) {
            setVisible(true);
            // Auto close after duration
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(onClose, 300); // Wait for fade out
            }, 3500);
            return () => clearTimeout(timer);
        }
    }, [type, combatData, catastropheData, onClose]);

    if (!type) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center pointer-events-none transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
            
            <div className={`relative bg-white rounded-3xl shadow-2xl p-6 min-w-[320px] max-w-md transform transition-all duration-500 ${visible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'}`}>
                
                {/* COMBAT VIEW */}
                {type === 'combat' && combatData && (
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center animate-bounce">
                                <Swords size={32} className="text-rose-600" />
                            </div>
                        </div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-1">
                            WAR AT {combatData.location}
                        </h2>
                        <div className="text-xs text-slate-400 font-bold mb-6">BATTLE REPORT</div>

                        <div className="flex justify-between items-center gap-4 mb-6">
                            {/* Attacker */}
                            <div className="flex-1 flex flex-col items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase mb-2">Attacker</span>
                                <div className="w-14 h-14 bg-slate-800 text-white rounded-xl flex items-center justify-center text-2xl font-bold shadow-lg ring-4 ring-slate-100">
                                    {combatData.attackerRoll}
                                </div>
                            </div>
                            
                            <div className="text-slate-300 font-bold text-lg">VS</div>

                            {/* Defender */}
                            <div className="flex-1 flex flex-col items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase mb-2">Defender</span>
                                <div className="w-14 h-14 bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center text-2xl font-bold shadow-inner">
                                    {combatData.defenderRoll}
                                </div>
                            </div>
                        </div>

                        <div className={`p-3 rounded-xl border-l-4 text-sm font-medium ${combatData.damageDealt > 0 ? 'bg-rose-50 border-rose-500 text-rose-900' : 'bg-blue-50 border-blue-500 text-blue-900'}`}>
                            {combatData.damageDealt > 0 ? (
                                <div className="flex items-center gap-2">
                                    <Activity size={16} />
                                    <span>
                                        {combatData.isCounter ? "Counter-Attack! " : "Direct Hit! "}
                                        <b className="text-lg">{combatData.damageDealt}</b> Damage dealt.
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Shield size={16} />
                                    <span>Attack Blocked! No damage.</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* CATASTROPHE VIEW */}
                {type === 'catastrophe' && catastropheData && (
                    <div className="text-center w-full">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center animate-pulse">
                                <Zap size={32} className="text-amber-600" />
                            </div>
                        </div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-1">
                            GLOBAL EVENT
                        </h2>
                        <div className="text-xs text-slate-400 font-bold mb-6">ROUND {catastropheData.round} REPORT</div>

                        <div className="space-y-3">
                            {catastropheData.details.map((detail, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-8 rounded-full ${detail.playerId === 1 ? 'bg-blue-500' : 'bg-rose-500'}`}></div>
                                        <span className="font-bold text-sm text-slate-700">{detail.playerName}</span>
                                    </div>
                                    
                                    {detail.type === 'plague' && (
                                        <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                                            <Skull size={14} />
                                            <span className="font-bold text-sm">-{detail.amount} PLAGUE</span>
                                        </div>
                                    )}
                                    {detail.type === 'prosperity' && (
                                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                            <TrendingUp size={14} />
                                            <span className="font-bold text-sm">+{detail.amount} BOOM</span>
                                        </div>
                                    )}
                                    {detail.type === 'neutral' && (
                                        <div className="flex items-center gap-2 text-slate-400 px-2 py-1">
                                            <span className="font-bold text-xs">NO EFFECT</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
