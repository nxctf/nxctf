import { GripVertical, Edit2, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { Button } from "@/shared/ui/button";
import { ADMIN_ROW_CLASS } from "../../ui";
import { getColorClasses } from "../lib/category-colors";
import { RenderLucideIcon } from "../lib/category-icons";
import type { DbCategory } from "../types";

interface Props {
  category: DbCategory;
  onEdit: () => void;
  onDelete: () => void;
}

export default function SortableCategoryRow({
  category,
  onEdit,
  onDelete,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.name });

  const style = {
    transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
    transition,
  };

  const colors = getColorClasses(category.color);

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={
        isDragging
          ? "relative z-50 bg-blue-50/60 opacity-90 shadow-md dark:bg-blue-950/30"
          : ADMIN_ROW_CLASS
      }
    >
      <td className="py-2.5 pl-4 pr-2 w-10">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>

      {/* Name cell: colored icon badge + bold name + muted description */}
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.iconBg}`}
          >
            <RenderLucideIcon
              name={category.icon}
              className={`h-4 w-4 ${colors.iconText} ${colors.iconTextDark}`}
            />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {category.name}
            </p>
            {category.description && (
              <p className="mt-0.5 text-[10px] text-gray-400 line-clamp-1">
                {category.description}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Color dot */}
      <td className="whitespace-nowrap py-2.5 px-3">
        <div className="flex justify-center">
          <span
            className={`h-3 w-3 rounded-full shadow-sm ring-2 ${colors.dot} ${colors.ring}`}
          />
        </div>
      </td>

      {/* Actions */}
      <td className="whitespace-nowrap py-2.5 pl-3 pr-4">
        <div className="flex items-center justify-end gap-1">
          <Button
            onClick={onEdit}
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={onDelete}
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
