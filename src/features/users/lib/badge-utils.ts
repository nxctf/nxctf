import React from 'react'
import { Award, Crown, Droplet, Flame, Medal, ShieldCheck, Swords, Target, Trophy, Zap, LayoutGrid, Grid2X2, Grid3X3, Layers } from 'lucide-react'
import { Badge } from '../types'

export function getUserBadges(rank: number | null, firstBloodCount: number, solvedCount: number, completedCategoryCount: number): Badge[] {
  const badges: Badge[] = [];
  
  // Rank badges: only show if rank is a positive number AND user has at least one solve
  if (typeof rank === 'number' && rank > 0 && solvedCount > 0) {
    if (rank === 1) {
      badges.push({ label: 'Top 1', color: 'bg-yellow-400 text-yellow-900 border-yellow-500', icon: React.createElement(Crown, { className: "h-3.5 w-3.5" }) });
    } else if (rank <= 3) {
      badges.push({ label: 'Top 3', color: 'bg-yellow-300 text-yellow-900 border-yellow-400', icon: React.createElement(Trophy, { className: "h-3.5 w-3.5" }) });
    } else if (rank <= 10) {
      badges.push({ label: 'Top 10', color: 'bg-yellow-200 text-yellow-900 border-yellow-300', icon: React.createElement(Medal, { className: "h-3.5 w-3.5" }) });
    } else if (rank <= 25) {
      badges.push({ label: 'Top 25', color: 'bg-yellow-100 text-yellow-900 border-yellow-200', icon: React.createElement(Award, { className: "h-3.5 w-3.5" }) });
    } else if (rank <= 50) {
      badges.push({ label: 'Top 50', color: 'bg-yellow-50 text-yellow-900 border-yellow-100', icon: React.createElement(ShieldCheck, { className: "h-3.5 w-3.5" }) });
    }
  }

  // First Blood (show only the highest tier)
  if (firstBloodCount >= 10) {
    badges.push({ label: 'King of First Bloods', color: 'bg-pink-200 text-pink-900 border-pink-400', icon: React.createElement(Crown, { className: "h-3.5 w-3.5" }) });
  } else if (firstBloodCount >= 5) {
    badges.push({ label: '5+ First Bloods', color: 'bg-red-200 text-red-800 border-red-400', icon: React.createElement(Droplet, { className: "h-3.5 w-3.5" }) });
  } else if (firstBloodCount >= 1) {
    badges.push({ label: 'First Blood', color: 'bg-red-100 text-red-700 border-red-200', icon: React.createElement(Zap, { className: "h-3.5 w-3.5" }) });
  }

  // Solved
  if (solvedCount >= 100) badges.push({ label: '100+ Solves', color: 'bg-green-700 text-white border-green-800', icon: React.createElement(Swords, { className: "h-3.5 w-3.5" }) });
  else if (solvedCount >= 50) badges.push({ label: '50+ Solves', color: 'bg-green-600 text-white border-green-700', icon: React.createElement(Trophy, { className: "h-3.5 w-3.5" }) });
  else if (solvedCount >= 25) badges.push({ label: '25+ Solves', color: 'bg-green-500 text-white border-green-600', icon: React.createElement(Target, { className: "h-3.5 w-3.5" }) });
  else if (solvedCount >= 10) badges.push({ label: '10+ Solves', color: 'bg-green-400 text-white border-green-500', icon: React.createElement(Flame, { className: "h-3.5 w-3.5" }) });

  // Category completion (show only the highest tier)
  if (completedCategoryCount >= 10) {
    badges.push({ label: '10+ Categories', color: 'bg-blue-700 text-white border-blue-800', icon: React.createElement(LayoutGrid, { className: "h-3.5 w-3.5" }) });
  } else if (completedCategoryCount >= 5) {
    badges.push({ label: '5+ Categories', color: 'bg-blue-600 text-white border-blue-700', icon: React.createElement(Grid3X3, { className: "h-3.5 w-3.5" }) });
  } else if (completedCategoryCount >= 3) {
    badges.push({ label: '3+ Categories', color: 'bg-blue-500 text-white border-blue-600', icon: React.createElement(Grid2X2, { className: "h-3.5 w-3.5" }) });
  } else if (completedCategoryCount >= 1) {
    badges.push({ label: 'Category Finisher', color: 'bg-blue-400 text-white border-blue-500', icon: React.createElement(Layers, { className: "h-3.5 w-3.5" }) });
  }

  return badges;
}
