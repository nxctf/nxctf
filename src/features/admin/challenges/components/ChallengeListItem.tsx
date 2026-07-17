import React from "react";
import DifficultyBadge from "@/features/challenges/components/DifficultyBadge";
import { Badge, Button } from "@/shared/ui";
import {
  Pencil,
  Trash2,
  Flag,
  Variable,
  CheckCircle2,
  CircleOff,
  Wrench,
  ServerCog,
  ListChecks,
  MapPin,
  Shield,
  CalendarSync,
  CalendarClock,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import DateBadge, { formatDate } from "@/shared/components/DateBadge";
import { Challenge } from "../types";
import { useCategories } from "@/shared/contexts/CategoriesContext";

interface ChallengeListItemProps {
  challenge: Challenge;
  scheduledAt?: string;
  onEdit: (challenge: Challenge) => void;
  onDelete: (id: string) => void;
  onViewFlag: (id: string) => void;
  onToggleActive: (id: string, checked: boolean) => Promise<any>;
  onToggleMaintenance: (id: string, checked: boolean) => Promise<any>;
  onRepost?: (challenge: Challenge) => void;
  onSchedule?: (challenge: Challenge) => void;
}

const ChallengeListItem: React.FC<ChallengeListItemProps> = ({
  challenge,
  scheduledAt,
  onEdit,
  onDelete,
  onViewFlag,
  onToggleActive,
  onToggleMaintenance,
  onRepost,
  onSchedule,
}) => {
  const handleToggleActive = async (id: string, checked: boolean) => {
    await onToggleActive(id, checked);
  };

  const { categories: dbCategories } = useCategories();
  const parts = (challenge.category || "").split("/");
  const parentCat = parts[0];
  const subCat = parts.slice(1).join("/");

  const dbCat = dbCategories.find(
    (c) => c.name.toLowerCase() === parentCat.toLowerCase(),
  );
  const CategoryIcon = dbCat
    ? (LucideIcons as any)[dbCat.icon] || Shield
    : null;
  const catColor = dbCat ? `text-${dbCat.color}-500` : "";

  return (
    <div className="w-full px-5 py-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 order-2 sm:order-1 flex-1">
          <DifficultyBadge difficulty={challenge.difficulty} width={92} />

          <div className="min-w-0 pl-3 flex-1">
            <div className="font-medium truncate text-gray-900 dark:text-white">
              {challenge.title}
            </div>
            <div className="text-xs text-muted-foreground dark:text-gray-300 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className="shrink-0 flex items-center gap-1 font-semibold uppercase tracking-wide">
                {CategoryIcon && (
                  <CategoryIcon className={`h-3 w-3 shrink-0 ${catColor}`} />
                )}
                {parentCat}
              </span>
              {subCat && (
                <>
                  <span className="shrink-0 text-gray-400">/</span>
                  <span className="truncate min-w-0 max-w-[200px]">
                    {subCat}
                  </span>
                </>
              )}
              <span className="shrink-0 text-gray-400">•</span>
              <span className="shrink-0 whitespace-nowrap">
                {challenge.points} pts
              </span>
              <span className="shrink-0 text-gray-400">•</span>
              <DateBadge dateStr={challenge.created_at} />
              {scheduledAt && (
                <span className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400" title="Scheduled activation">
                  <CalendarClock size={11} />
                  {formatDate(scheduledAt)}
                </span>
              )}
              {challenge.is_dynamic && (
                <>
                  <span className="shrink-0 text-gray-400">•</span>
                  <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-600 dark:text-white px-1 py-0.5">
                    <span className="inline-block min-w-[14px] text-center text-[10px] leading-4 font-semibold">
                      Dynamic:{" "}
                      {`${challenge.max_points ?? "-"}-${challenge.min_points ?? "-"}-${challenge.decay_per_solve ?? "-"}`}
                    </span>
                  </Badge>
                </>
              )}
              {challenge.services && challenge.services.length > 0 && (
                <span
                  className="inline-flex items-center gap-1 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-sky-200/50 dark:border-sky-800/30 shrink-0 select-none cursor-help"
                  title={`Services: ${challenge.services.join(", ")}`}
                >
                  <ServerCog size={11} />
                  <span>Service</span>
                </span>
              )}
              {challenge.flag_placeholder && (
                <span
                  className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-emerald-200/50 dark:border-emerald-800/30 shrink-0 select-none cursor-help"
                  title="Flag placeholder is enabled"
                >
                  <Variable size={11} />
                  <span>Placeholder</span>
                </span>
              )}
              {challenge.has_questions && (
                <span
                  className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-amber-200/50 dark:border-amber-800/30 shrink-0 select-none cursor-help"
                  title="Has sub-challenge questions (tasks)"
                >
                  <ListChecks size={11} />
                  <span>Task</span>
                </span>
              )}
              {challenge.has_geo_flag && (
                <span
                  className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-rose-200/50 dark:border-rose-800/30 shrink-0 select-none cursor-help"
                  title="Location-based geo-guessing challenge"
                >
                  <MapPin size={11} />
                  <span>Geo</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 justify-end order-1 sm:order-2 w-full sm:w-auto shrink-0">
          {onRepost && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRepost(challenge)}
              aria-label="Repost Challenge"
              title="Repost (change post date)"
              className="text-indigo-600 dark:text-indigo-400"
            >
              <CalendarSync size={16} />
            </Button>
          )}
          {onSchedule && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSchedule(challenge)}
              aria-label="Schedule Activation"
              title="Schedule activation"
              className="text-cyan-600 dark:text-cyan-400"
            >
              <CalendarClock size={16} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={`${challenge.is_maintenance ? "text-amber-500 dark:text-amber-400" : "text-gray-400 dark:text-gray-600"}`}
            onClick={async () =>
              onToggleMaintenance(challenge.id, !challenge.is_maintenance)
            }
            aria-label={
              challenge.is_maintenance
                ? "Disable Maintenance"
                : "Enable Maintenance"
            }
            title={
              challenge.is_maintenance
                ? "Disable Maintenance"
                : "Enable Maintenance"
            }
          >
            <Wrench size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`${challenge.is_active ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-600"}`}
            onClick={async () =>
              onToggleActive(challenge.id, !challenge.is_active)
            }
            aria-label={
              challenge.is_active
                ? "Deactivate Challenge"
                : "Activate Challenge"
            }
            title={
              challenge.is_active
                ? "Deactivate Challenge"
                : "Activate Challenge"
            }
          >
            {challenge.is_active ? (
              <CheckCircle2 size={16} />
            ) : (
              <CircleOff size={16} />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(challenge)}
            aria-label="Edit Challenge"
            title="Edit Challenge"
            className="text-blue-600 dark:text-blue-400"
          >
            <Pencil size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(challenge.id)}
            aria-label="Delete Challenge"
            title="Delete Challenge"
            className="text-red-600 dark:text-red-400"
          >
            <Trash2 size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewFlag(challenge.id)}
            aria-label="View Flag"
            title="View Flag"
            className="text-gray-600 dark:text-gray-300"
          >
            <Flag size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeListItem;
