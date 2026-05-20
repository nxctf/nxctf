import { memo } from "react";
import { AlertTriangle, CheckCircle2, Flag, Flame, Sparkles, Users } from "lucide-react";

import type { ChallengeWithSolve } from "@/shared/types";
import { Badge, Button, Card, CardContent } from "@/shared/ui";
import { getChallengeFeatureType } from "../lib";

type ChallengeCardProps = {
  challenge: ChallengeWithSolve & {
    has_first_blood?: boolean;
    is_new?: boolean;
    is_team_solved?: boolean;
    is_maintenance?: boolean;
  };
  highlightTeamSolves?: boolean;
  onOpenChallenge: (challenge: ChallengeWithSolve) => void;
};

function normalizeDifficulty(difficulty: ChallengeWithSolve["difficulty"]): string {
  const value = String(difficulty || "").trim();
  if (!value) return "Unknown";
  if (value === "imposible") return "Impossible";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function ChallengeCard({
  challenge,
  highlightTeamSolves = true,
  onOpenChallenge,
}: ChallengeCardProps) {
  const isMaintenance = !!challenge.is_maintenance;
  const isSolved = !!challenge.is_solved;
  const isTeamSolved = !!challenge.is_team_solved && highlightTeamSolves;
  const isAnySolved = isSolved || isTeamSolved;
  const featureType = getChallengeFeatureType(challenge);
  const featureBadge = featureType === "N" ? null : featureType;
  const solveCount = challenge.total_solves ?? 0;

  return (
    <Button
      type="button"
      variant="ghost"
      data-tour="challenge-card"
      disabled={isMaintenance}
      onClick={() => onOpenChallenge(challenge)}
      className="group h-full w-full justify-start rounded-2xl p-0 text-left transition-all duration-200 hover:scale-[1.02] hover:bg-transparent disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-70"
    >
      <Card className="h-full w-full overflow-hidden border-border bg-card shadow-xs transition-all duration-200 group-hover:border-ring/40 group-hover:shadow-md">
        <CardContent className="flex h-full flex-col gap-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Badge variant="secondary" className="max-w-full truncate uppercase">
                {challenge.category}
              </Badge>
              {featureBadge ? (
                <Badge variant="outline" className="uppercase">
                  {featureBadge}
                </Badge>
              ) : null}
            </div>

            <div className="shrink-0 text-right text-base font-black leading-none text-primary">
              {challenge.points}
              <span className="ml-1 text-xs font-semibold text-muted-foreground">pts</span>
            </div>
          </div>

          <div className="min-h-10 flex-1">
            <h3 className="line-clamp-2 text-base font-bold leading-5 text-card-foreground">
              {challenge.title}
            </h3>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
            <div className="flex min-w-0 items-center gap-2">
              {isMaintenance ? (
                <>
                  <AlertTriangle className="size-3.5 shrink-0 text-destructive" />
                  <span className="truncate font-semibold text-destructive">Maintenance</span>
                </>
              ) : (
                <>
                  <span className="size-2 shrink-0 rounded-full bg-primary" />
                  <span className="truncate font-semibold uppercase tracking-wide">
                    {normalizeDifficulty(challenge.difficulty)}
                  </span>
                </>
              )}
            </div>

            {!isMaintenance ? (
              <div className="flex shrink-0 items-center gap-1.5">
                {isSolved ? <Flag className="size-3.5 text-primary" /> : null}
                {isTeamSolved ? <CheckCircle2 className="size-3.5 text-primary" /> : null}
                {!isAnySolved && !challenge.has_first_blood ? (
                  <Flame className="size-3.5 text-primary" />
                ) : null}
                {!isAnySolved && challenge.is_new ? (
                  <Sparkles className="size-3.5 text-primary" />
                ) : null}
                <Users className="size-3.5" />
                <span className="font-mono">
                  {solveCount} {solveCount === 1 ? "solve" : "solves"}
                </span>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Button>
  );
}

export default memo(ChallengeCard);
