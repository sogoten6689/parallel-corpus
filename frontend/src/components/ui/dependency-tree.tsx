'use client';

import React, { useMemo } from 'react';

type TokenItem = {
  text: string;
  pos?: string;
  lemma?: string;
  dep?: string;
  head?: string | number; // head can be index (1-based or 0-based) or head token text
};

type DependencyTreeProps = {
  tokens: TokenItem[];
  height?: number; // total SVG height
  distance?: number; // horizontal distance step between tokens
};

// Normalize head to a 0-based index when possible. If not resolvable, return -1 (root)
function resolveHeadIndex(tokens: TokenItem[], tokenIndex: number): number {
  const head = tokens[tokenIndex]?.head;
  if (head === undefined || head === null) return -1;

  // number-like head (1-based or 0-based)
  if (typeof head === 'number') {
    if (head < 0) return -1;
    // assume 0-based if in range, else treat as 1-based
    if (head >= 0 && head < tokens.length) return head;
    const maybeZeroBased = head - 1;
    return maybeZeroBased >= 0 && maybeZeroBased < tokens.length ? maybeZeroBased : -1;
  }

  const trimmed = String(head).trim();
  // numeric string
  if (/^-?\d+$/.test(trimmed)) {
    const n = parseInt(trimmed, 10);
    if (n < 0) return -1;
    if (n >= 0 && n < tokens.length) return n; // already 0-based
    const maybeZeroBased = n - 1; // possibly 1-based
    return maybeZeroBased >= 0 && maybeZeroBased < tokens.length ? maybeZeroBased : -1;
  }

  // head given as token text -> map to first occurrence not equal to self (fallback)
  const headIdx = tokens.findIndex((t, idx) => idx !== tokenIndex && t.text === trimmed);
  return headIdx >= 0 ? headIdx : -1;
}

// Compute arcs similar to spaCy displaCy manual format
function buildArcs(tokens: TokenItem[]) {
  type Arc = { start: number; end: number; label: string; dir: 'left' | 'right' };
  const arcs: Arc[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const headIdx = resolveHeadIndex(tokens, i);
    if (headIdx < 0 || headIdx === i) continue; // root or self-loop not drawn
    const start = Math.min(headIdx, i);
    const end = Math.max(headIdx, i);
    const dir: 'left' | 'right' = headIdx < i ? 'left' : 'right';
    const label = tokens[i]?.dep || '';
    arcs.push({ start, end, label, dir });
  }
  return arcs;
}

// Given arcs, compute levels to avoid overlaps (simple greedy layering)
function assignArcLevels(arcs: { start: number; end: number }[]) {
  const levels: number[] = new Array(arcs.length).fill(0);
  for (let i = 0; i < arcs.length; i++) {
    let level = 1;
    let placed = false;
    while (!placed) {
      let conflicts = false;
      for (let j = 0; j < i; j++) {
        if (levels[j] === level) {
          const a = arcs[i];
          const b = arcs[j];
          const overlap = !(a.end <= b.start || b.end <= a.start);
          if (overlap) {
            conflicts = true;
            break;
          }
        }
      }
      if (!conflicts) {
        levels[i] = level;
        placed = true;
      } else {
        level++;
      }
    }
  }
  return levels;
}

const DependencyTree: React.FC<DependencyTreeProps> = ({ tokens, height = 320, distance = 175 }) => {
  const words = tokens.map(t => ({ text: t.text, tag: t.pos || '' }));
  const arcs = useMemo(() => buildArcs(tokens), [tokens]);
  const levels = useMemo(() => assignArcLevels(arcs), [arcs]);

  const width = Math.max(200, distance * tokens.length + 100);
  const tokenBaselineY = height - 40;

  // vertical spacing per level
  const levelStep = 70;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} style={{ background: '#fff' }}>
        {words.map((w, i) => {
          const x = 50 + i * distance;
          return (
            <g key={`t-${i}`} className="dep-token">
              <text fill="#000" textAnchor="middle" y={tokenBaselineY}>
                <tspan x={x} style={{ fontFamily: 'Arial', fontSize: 16 }}>{w.text}</tspan>
                <tspan x={x} dy="2em" style={{ fontFamily: 'Arial', fontSize: 12, fill: '#555' }}>{w.tag}</tspan>
              </text>
            </g>
          );
        })}

        {arcs.map((arc, idx) => {
          const startX = 50 + arc.start * distance;
          const endX = 50 + arc.end * distance;
          const level = levels[idx];
          const topY = tokenBaselineY - (level * levelStep);
          const pathId = `arc-${idx}`;

          const d = `M${startX},${tokenBaselineY - 20} C ${startX},${topY} ${endX},${topY} ${endX},${tokenBaselineY - 20}`;
          const labelX = (startX + endX) / 2;
          const arrowDir = arc.dir === 'left' ? -1 : 1;
          const arrowPath = `M${endX},${tokenBaselineY - 18} l${-8 * arrowDir},-8 l${8 * arrowDir},0`;

          return (
            <g key={`a-${idx}`} className="dep-arc">
              <path d={d} stroke="#000" strokeWidth={2} fill="none" />
              <text dy="-4" style={{ fontSize: 12, fontFamily: 'Arial' }}>
                <textPath href={`#${pathId}`} startOffset="50%" />
              </text>
              <text x={labelX} y={topY + 14} textAnchor="middle" style={{ fontSize: 12, fontFamily: 'Arial', fill: '#333' }}>{arc.label}</text>
              <path d={arrowPath} fill="#000" />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default DependencyTree;


