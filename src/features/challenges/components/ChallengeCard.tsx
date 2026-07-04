// React Imports
import React, { memo } from "react";
import { Flame, Sparkles, AlertTriangle, Flag, CheckCircle2, ListChecks, Server, Variable, MapPin, Shield } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// Shared Imports
import APP from '@/config';
import { useCategories } from '@/shared/contexts/CategoriesContext';
import { ChallengeWithSolve } from '@/shared/types'
import { getCategoryDetails, getCategoryIcon, getDifficultyStyle, getChallengeFeatureType, getCategoryCardHoverStyles } from '../lib'

interface ChallengeCardProps {
  challenge: ChallengeWithSolve & {
    has_first_blood?: boolean;
    is_new?: boolean;
    has_questions?: boolean;
    is_team_solved?: boolean;
    is_maintenance?: boolean;
  };
  highlightTeamSolves?: boolean;
  onOpenChallenge: (challenge: ChallengeWithSolve) => void;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, highlightTeamSolves = true, onOpenChallenge }) => {
  const isRecentlyCreated = challenge.is_new;
  const noFirstBlood = !challenge.has_first_blood;
  const isMaintenance = !!challenge.is_maintenance;
  const isTeamSolved = !!challenge.is_team_solved && highlightTeamSolves;

  const featureType = getChallengeFeatureType(challenge);
  const featureBadge = featureType === 'N' ? null : featureType;

  const isSolved = challenge.is_solved;
  const isAnySolved = isSolved || isTeamSolved;

  // Difficulty color mapping
  const rawDiff = (challenge.difficulty || '').toString().trim();
  const normalizedDiff = rawDiff === 'imposible' ? 'Impossible' : rawDiff.charAt(0).toUpperCase() + rawDiff.slice(1).toLowerCase();
  const colorName = (APP as any).difficultyStyles?.[normalizedDiff];
  const { dotClass, textClass: diffTextColor } = getDifficultyStyle(colorName);

  // Icon lookup for background decoration (UI-layer only)
  const { categories: dbCategories } = useCategories();
  const parentCategory = challenge.category ? challenge.category.split('/')[0] : '';
  const dbCat = dbCategories.find(c => c.name.toLowerCase() === parentCategory.toLowerCase());

  const categoryIconColor = dbCat ? `text-${dbCat.color}-500` : getCategoryDetails(challenge.category).color;
  const categoryBorderColor = dbCat ? `border-${dbCat.color}-500/30` : getCategoryDetails(challenge.category).borderColor;
  const categoryBadgeColor = dbCat ? `bg-${dbCat.color}-500/15 text-${dbCat.color}-500` : getCategoryDetails(challenge.category).badgeColor;
  const CategoryIcon = dbCat ? ((LucideIcons as any)[dbCat.icon] || Shield) : getCategoryIcon(challenge.category);
  const cardHover = getCategoryCardHoverStyles(categoryIconColor);

  const handleOpen = () => {
    if (!isMaintenance) onOpenChallenge(challenge);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (isMaintenance || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onOpenChallenge(challenge);
  };

  return (
    <div
      data-tour="challenge-card"
      key={challenge.id}
      role={isMaintenance ? undefined : 'button'}
      tabIndex={isMaintenance ? undefined : 0}
      className={`relative w-full h-full group ${isMaintenance ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105 hover:z-50'} transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950
        ${isAnySolved ? 'opacity-55 hover:opacity-85' : 'opacity-100'}`}
      style={{ transformOrigin: 'center' }}
      onClick={isMaintenance ? undefined : handleOpen}
      onMouseDown={(event) => event.preventDefault()}
      onKeyDown={handleKeyDown}
    >
      {/* Hover Glow Overlay */}
      <div className={`absolute inset-0 rounded-2xl transition-all duration-500 pointer-events-none
        ${isSolved ? 'group-hover:bg-green-500/[0.08]' :
          isTeamSolved ? 'group-hover:bg-purple-500/[0.08]' :
            cardHover.glowHover}`} />

      {/* Top Accent Line — only for unsolved */}
      {!isAnySolved && !isMaintenance && (
        <div className={`absolute top-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-transparent ${cardHover.accentLine} to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      )}

      <div className={`relative h-full flex flex-col p-4 md:p-5 rounded-2xl border backdrop-blur-sm transition-all duration-400 z-0
        ${isMaintenance
          ? 'bg-amber-500/[0.02] border-amber-500/20 dark:border-amber-500/10 border-dashed shadow-none'
          : isSolved
            ? 'bg-gray-800/60 border-green-500/25 dark:border-green-500/20 shadow-none'
            : isTeamSolved
              ? 'bg-gray-800/60 border-purple-500/25 dark:border-purple-500/20 shadow-none'
              : 'bg-gray-800/85 border-gray-600/50 shadow-sm shadow-black/30 group-hover:shadow-xl group-hover:shadow-black/40'}`}
      >

        {/* Subtle Background Category Icon */}
        <div className={`absolute right-0 bottom-0 pointer-events-none z-0 overflow-hidden rounded-br-2xl transition-transform duration-500 ${categoryIconColor}
          ${isAnySolved ? 'opacity-[0.04]' : 'opacity-[0.15] group-hover:opacity-[0.22] group-hover:scale-105 transition-all'}`}>
          <CategoryIcon size={110} strokeWidth={1.2} />
        </div>

        {/* Solved Flag Badge — flush top-right corner, only user-solved */}
        {isSolved && (
          <div className="absolute top-0 right-0 z-20 flex items-center justify-center w-6 h-6 rounded-tr-2xl rounded-bl-xl bg-green-500/15 border-b border-l border-green-500/40">
            <Flag size={10} className="text-green-400 fill-green-400" strokeWidth={2} />
          </div>
        )}

        {/* Team Solved Badge — top-right, only team solved (not personally) */}
        {isTeamSolved && !isSolved && (
          <div className="absolute top-0 right-0 z-20 flex items-center justify-center w-6 h-6 rounded-tr-2xl rounded-bl-xl bg-purple-500/15 border-b border-l border-purple-500/40">
            <CheckCircle2 size={10} className="text-purple-400" strokeWidth={2} />
          </div>
        )}

        <div className="relative flex-1 flex flex-col z-10">
          {/* Maintenance Overlay Info */}
          {isMaintenance && (
            <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-white/70 dark:bg-gray-950 backdrop-blur-[4px] rounded-xl pointer-events-none">
              <p className="text-[10px] font-black text-center px-4 text-amber-600 dark:text-amber-500 leading-relaxed uppercase tracking-wider">
                This service is currently unavailable. Points remain awarded to those who solved it.
              </p>
            </div>
          )}

          {/* Header Area */}
          <div className="flex items-center justify-between gap-2 mb-3">

            {/* LEFT: Category Badge + Feature Badge */}
            <div className="min-w-0 flex flex-1 items-center gap-1.5 overflow-hidden pr-1">
              {(() => {
                const parts = (challenge.category || '').split('/');
                const parent = parts[0];
                const sub = parts.slice(1).join('/');
                return (
                  <div className="flex items-center gap-1 min-w-0">
                    <div
                      title={parent}
                      className={`min-w-0 truncate whitespace-nowrap text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded transition-all duration-300 ${categoryBadgeColor}
                      opacity-25 group-hover:opacity-100`}
                    >
                      {parent}
                    </div>
                    {sub && (
                      <>
                        <span className="text-[9px] font-bold text-gray-500 dark:text-gray-600 select-none">
                          /
                        </span>
                        <div
                          title={sub}
                          className={`min-w-0 truncate whitespace-nowrap text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border border-dashed transition-all duration-300 ${categoryBorderColor} ${categoryIconColor}
                          opacity-20 group-hover:opacity-85`}
                        >
                          {sub}
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}


            </div>

            {/* RIGHT: Points */}
            <div className={`shrink-0 text-base font-black tracking-tight leading-none transition-colors duration-400
                ${isSolved
                ? 'text-green-400'
                : isTeamSolved
                  ? 'text-purple-400'
                  : 'text-white'}`}>
              {challenge.points} <span className="text-[10px] font-bold opacity-60">pts</span>
            </div>
          </div>

          {/* Title */}
          <div className="mb-4 flex-1">
            <h3 className={`text-sm font-bold leading-5 line-clamp-1 md:text-base md:leading-6 transition-colors duration-400
              ${isAnySolved
                ? `text-gray-400 ${cardHover.titleHover}`
                : `text-white ${cardHover.titleHover}`}`}>
              {challenge.title}
            </h3>
          </div>
        </div>

        {/* Footer Area */}
        <div className={`flex items-center justify-between pt-3 border-t z-10 relative transition-colors duration-400 ${categoryBorderColor}`}>
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
            {isMaintenance ? (
              <span className="text-amber-500 flex items-center gap-1.5 font-black opacity-60 dark:opacity-50">
                <AlertTriangle size={12} />
                Maintenance
              </span>
            ) : (
              <div className="flex items-center gap-2 select-none">
                <span className={`text-[11px] font-bold tracking-wide transition-all duration-300 ${diffTextColor}
                  opacity-30 group-hover:opacity-100`}
                >
                  {normalizedDiff}
                </span>
                {featureType !== 'N' && (
                  <>
                    <span className="text-gray-600 dark:text-gray-500 select-none">•</span>
                    <div className="flex items-center gap-1.5">
                      {featureType.includes('T') && (
                        <span title="Tasks (Sub-challenges)">
                          <ListChecks
                            size={13}
                            className="text-gray-400 dark:text-gray-500 transition-colors duration-200 group-hover:text-blue-500 dark:group-hover:text-blue-400"
                          />
                        </span>
                      )}
                      {featureType.includes('S') && (
                        <span title="Active Service Container">
                          <Server
                            size={13}
                            className="text-gray-400 dark:text-gray-500 transition-colors duration-200 group-hover:text-emerald-500 dark:group-hover:text-emerald-400"
                          />
                        </span>
                      )}
                      {featureType.includes('F') && (
                        <span title="Dynamic / Custom Flag">
                          <Variable
                            size={13}
                            className="text-gray-400 dark:text-gray-500 transition-colors duration-200 group-hover:text-amber-500 dark:group-hover:text-amber-400"
                          />
                        </span>
                      )}
                      {featureType.includes('G') && (
                        <span title="Location-based (Geo Guess)">
                          <MapPin
                            size={13}
                            className="text-gray-400 dark:text-gray-500 transition-colors duration-200 group-hover:text-rose-500 dark:group-hover:text-rose-400"
                          />
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {!isMaintenance && (
            <div className="flex items-center gap-3">
              {noFirstBlood ? (
                <span className="text-orange-400 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                  <Flame size={11} className="fill-current" />
                  First Blood
                </span>
              ) : isRecentlyCreated ? (
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
                    <Sparkles size={11} />
                    New
                  </span>
                  <div className="w-[1px] h-3 bg-gray-700" />
                  <div className="text-[10px] font-mono text-gray-500">
                    {challenge.total_solves ?? 0} solves
                  </div>
                </div>
              ) : (
                <div className="text-[10px] font-mono text-gray-500">
                  {challenge.total_solves ?? 0} {challenge.total_solves === 1 ? 'solve' : 'solves'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default memo(ChallengeCard);
