import { GripVertical, Edit2, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { Button } from "@/shared/ui/button";
import { ADMIN_ROW_CLASS } from "../../ui";
import type { DbSubCategory } from "../types";

interface Props {
  subCategory: DbSubCategory;
  onEdit: () => void;
  onDelete: () => void;
}

export default function SortableSubCategoryRow({ subCategory, onEdit, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subCategory.name });

  const style = {
    transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
    transition,
  };

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

      <td className="py-2.5 px-3">
        <p className="font-semibold text-gray-900 dark:text-gray-100">
          {subCategory.name}
        </p>
        {subCategory.description && (
          <p className="mt-0.5 text-[10px] text-gray-400 line-clamp-1">
            {subCategory.description}
          </p>
        )}
      </td>

      <td className="py-2.5 pl-3 pr-4">
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
