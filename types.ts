export type PlayerId = 1 | 2;
export type UnitType = 'peon' | 'horse' | 'tank';

export interface Troops {
  peon: number;
  horse: number;
  tank: number;
}

export interface Territory {
  id: string;
  owner: PlayerId | null;
  troops: Troops;
}

export interface Player {
  id: PlayerId;
  name: string;
  color: string;
  isAi: boolean;
  capital: string | null;
  movRest: number; // Cooldown
  isAlive: boolean;
}

export interface LogEntry {
  id: string;
  text: string;
  type: 'info' | 'combat' | 'event' | 'error';
  timestamp: number;
}

export interface GameState {
  territories: Record<string, Territory>;
  players: Player[];
  turnCount: number;
  roundCount: number;
  currentPlayerIndex: number;
  catastropheInterval: number;
  logs: LogEntry[];
  winner: PlayerId | 'draw' | null;
  selectedNode: string | null; // For UI selection
  isProcessing: boolean; // For AI or animation locks
}

export interface Coordinate {
  x: number;
  y: number;
}
