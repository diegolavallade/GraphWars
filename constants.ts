import { Coordinate } from './types';

// Original Python coordinates
export const RAW_POSITIONS: Record<string, [number, number]> = {
    'A': [-12, 16], 'B': [-8, 16], 'C': [0, 18], 'D': [-10, 14],
    'E': [-6, 14], 'F': [-2, 14], 'G': [-8, 12], 'H': [-4, 12],
    'I': [-7, 10], 'J': [-5, 8], 'K': [-4, 5], 'L': [-3, 3],
    'M': [-2, 6], 'N': [4, 16], 'O': [4, 12], 'P': [5, 9],
    'Q': [6, 6], 'R': [8, 1], 'S': [8, 4], 'T': [7, 17],
    'U': [7, 12], 'V': [8, 9], 'W': [8, 7], 'Z': [10, 5],
    'A1': [11, 1], 'B1': [10, 14], 'C1': [11, 8], 'D1': [13, 12],
    'E1': [14, 15], 'F1': [15, 9], 'G1': [18, 17], 'H1': [18, 11],
    'I1': [18, 8], 'K1': [19, 4], 'L1': [20, 2], 'M1': [23, 2],
    'N1': [22, 5], 'O1': [20, 12], 'P1': [24, 12], 'Q1': [24, 16],
    'R1': [21, 15], 'S1': [22, 18]
};

export const EDGES: [string, string][] = [
    ['A', 'D'], ['A', 'B'], ['B', 'D'], ['B', 'C'], ['B', 'E'], ['C', 'E'],
    ['C', 'F'], ['D', 'G'], ['D', 'E'], ['E', 'G'], ['E', 'H'], ['E', 'F'],
    ['F', 'H'], ['G', 'H'], ['G', 'I'], ['H', 'I'], ['I', 'J'], ['J', 'K'],
    ['K', 'M'], ['K', 'L'], ['L', 'M'], ['C', 'N'], ['M', 'Q'], ['N', 'O'],
    ['N', 'T'], ['O', 'P'], ['O', 'U'], ['P', 'Q'], ['P', 'U'], ['P', 'V'],
    ['Q', 'S'], ['Q', 'V'], ['Q', 'W'], ['R', 'S'], ['R', 'A1'], ['S', 'Z'],
    ['T', 'U'], ['T', 'B1'], ['U', 'B1'], ['U', 'V'], ['V', 'B1'], ['V', 'W'],
    ['V', 'C1'], ['W', 'C1'], ['W', 'Z'], ['Z', 'C1'], ['Z', 'A1'], ['B1', 'E1'],
    ['B1', 'D1'], ['C1', 'D1'], ['C1', 'F1'], ['D1', 'F1'], ['D1', 'E1'],
    ['E1', 'G1'], ['E1', 'H1'], ['F1', 'H1'], ['F1', 'I1'], ['G1', 'H1'],
    ['G1', 'R1'], ['G1', 'S1'], ['H1', 'I1'], ['H1', 'O1'], ['I1', 'K1'],
    ['K1', 'L1'], ['K1', 'N1'], ['L1', 'M1'], ['M1', 'N1'], ['O1', 'R1'],
    ['O1', 'P1'], ['P1', 'Q1'], ['Q1', 'S1'], ['Q1', 'R1'], ['R1', 'S1']
];

// Normalize positions for SVG (0-1000 range)
const minX = -14;
const maxX = 26;
const width = maxX - minX;

// Y needs to be inverted (SVG 0 is top) and scaled to fit ~600 height
const minY = 0;
const maxY = 20;
const height = maxY - minY;

export const MAP_POSITIONS: Record<string, Coordinate> = {};

Object.entries(RAW_POSITIONS).forEach(([key, [x, y]]) => {
  MAP_POSITIONS[key] = {
    // Map X to 50-950 (padding)
    x: 50 + ((x - minX) / width) * 900,
    // Map Y to 50-550 (padding). Note: In raw data, higher Y is "Up". In SVG, higher Y is "Down".
    // So we do (1 - normalized) to flip it.
    y: 50 + (1 - (y - minY) / height) * 500
  };
});

export const COLORS = {
  p1: '#3b82f6', // Blue 500
  p1Light: '#93c5fd',
  p2: '#f43f5e', // Rose 500
  p2Light: '#fda4af',
  neutral: '#cbd5e1', // Gray 400
  neutralDark: '#94a3b8',
  bg: '#f8fafc',
};
