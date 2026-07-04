"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/contexts/AuthContext";
import { isGlobalAdmin } from "@/features/admin/services/admin.service";
import { supabase } from "@/lib/supabase/client";
import {
  AdminContentLoading,
  AdminDataSurface,
  AdminEmptyState,
  AdminPageShell,
  AdminStickyToolbar,
  AdminTabs,
  useTabState,
} from "../../ui";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import toast from "react-hot-toast";
import { FolderOpen, Tag, Plus } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import type { DbCategory, DbSubCategory } from "../types";
import { CTF_ICONS, RenderLucideIcon } from "../lib/category-icons";
import { THEME_COLORS } from "../lib/category-colors";
import SortableCategoryRow from "./SortableCategoryRow";
import SortableSubCategoryRow from "./SortableSubCategoryRow";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [accessReady, setAccessReady] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);

  // Use untyped client to bypass typescript database.types sync issues
  const client = supabase as any;

  // Tab state
  const [activeTab, setActiveTab] = useTabState<"categories" | "subcategories">(
    "tab",
    "categories",
  );

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Data states
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [subCategories, setSubCategories] = useState<DbSubCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog open states
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [subCategoryDialogOpen, setSubCategoryDialogOpen] = useState(false);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] =
    useState(false);
  const [deleteSubCategoryDialogOpen, setDeleteSubCategoryDialogOpen] =
    useState(false);

  // Edit / select states
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [selectedSubCategoryName, setSelectedSubCategoryName] = useState("");

  // Category form state
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catIcon, setCatIcon] = useState("HelpCircle");
  const [catColor, setCatColor] = useState("blue");

  // Subcategory form state
  const [subName, setSubName] = useState("");
  const [subDesc, setSubDesc] = useState("");
  const [subSortOrder, setSubSortOrder] = useState<number | "">("");

  // ─── Data loading ──────────────────────────────────────────────────────────

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [catRes, subRes] = await Promise.all([
        client
          .from("categories")
          .select("*")
          .order("sort_order", { ascending: true, nullsFirst: false }),
        client
          .from("sub_categories")
          .select("*")
          .order("sort_order", { ascending: true, nullsFirst: false }),
      ]);

      if (catRes.error) throw catRes.error;
      if (subRes.error) throw subRes.error;

      setCategories((catRes.data || []) as DbCategory[]);
      setSubCategories((subRes.data || []) as DbSubCategory[]);
    } catch (err: any) {
      console.error("Failed to load categories data:", err);
      toast.error("Failed to load categories/subcategories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const checkAccess = async () => {
      if (authLoading) return;

      if (!user) {
        setAccessReady(true);
        router.push("/challenges");
        return;
      }

      const adminCheck = await isGlobalAdmin();
      if (!mounted) return;

      setIsAllowed(adminCheck);
      setAccessReady(true);

      if (!adminCheck) {
        router.push("/challenges");
        return;
      }

      await loadData();
    };

    void checkAccess();
    return () => {
      mounted = false;
    };
  }, [authLoading, user, router]);

  // ─── Category handlers ─────────────────────────────────────────────────────

  const handleOpenAddCategory = () => {
    setIsEditMode(false);
    setCatName("");
    setCatDesc("");
    setCatIcon("HelpCircle");
    setCatColor("blue");
    setCategoryDialogOpen(true);
  };

  const handleOpenEditCategory = (cat: DbCategory) => {
    setIsEditMode(true);
    setCatName(cat.name);
    setCatDesc(cat.description || "");
    setCatIcon(cat.icon || "HelpCircle");
    setCatColor(cat.color || "blue");
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!catName.trim()) {
      toast.error("Category name is required");
      return;
    }

    const payload = {
      p_name: catName.trim(),
      p_description: catDesc.trim(),
      p_icon: catIcon,
      p_color: catColor,
      p_sort_order: null,
    };

    try {
      if (isEditMode) {
        const { error } = await client.rpc("update_category", payload);
        if (error) throw error;
        toast.success("Category updated successfully");
      } else {
        const { error } = await client.rpc("add_category", payload);
        if (error) throw error;
        toast.success("Category added successfully");
      }
      setCategoryDialogOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save category");
    }
  };

  const handleOpenDeleteCategory = (name: string) => {
    setSelectedCategoryName(name);
    setDeleteCategoryDialogOpen(true);
  };

  const handleDeleteCategory = async () => {
    try {
      const { error } = await client.rpc("delete_category", {
        p_name: selectedCategoryName,
      });
      if (error) throw error;
      toast.success("Category deleted successfully");
      setDeleteCategoryDialogOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(
        err.message ||
          "Failed to delete category (ensure no challenges are using it)",
      );
    }
  };

  // ─── Subcategory handlers ──────────────────────────────────────────────────

  const handleOpenAddSubCategory = () => {
    setIsEditMode(false);
    setSubName("");
    setSubDesc("");
    setSubSortOrder("");
    setSubCategoryDialogOpen(true);
  };

  const handleOpenEditSubCategory = (sub: DbSubCategory) => {
    setIsEditMode(true);
    setSubName(sub.name);
    setSubDesc(sub.description || "");
    setSubSortOrder(sub.sort_order ?? "");
    setSubCategoryDialogOpen(true);
  };

  const handleSaveSubCategory = async () => {
    if (!subName.trim()) {
      toast.error("Subcategory name is required");
      return;
    }

    const payload = {
      p_name: subName.trim(),
      p_description: subDesc.trim(),
      p_sort_order: subSortOrder === "" ? null : Number(subSortOrder),
    };

    try {
      if (isEditMode) {
        const { error } = await client.rpc("update_subcategory", payload);
        if (error) throw error;
        toast.success("Subcategory updated successfully");
      } else {
        const { error } = await client.rpc("add_subcategory", payload);
        if (error) throw error;
        toast.success("Subcategory added successfully");
      }
      setSubCategoryDialogOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save subcategory");
    }
  };

  const handleOpenDeleteSubCategory = (name: string) => {
    setSelectedSubCategoryName(name);
    setDeleteSubCategoryDialogOpen(true);
  };

  const handleDeleteSubCategory = async () => {
    try {
      const { error } = await client.rpc("delete_subcategory", {
        p_name: selectedSubCategoryName,
      });
      if (error) throw error;
      toast.success("Subcategory deleted successfully");
      setDeleteSubCategoryDialogOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete subcategory");
    }
  };

  // ─── Drag-and-drop handlers ────────────────────────────────────────────────

  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.name === String(active.id));
    const newIndex = categories.findIndex((c) => c.name === String(over.id));
    const newOrder = arrayMove(categories, oldIndex, newIndex);

    setCategories(newOrder);

    try {
      const { error } = await client.rpc("reorder_categories", {
        p_ordered_names: newOrder.map((c) => c.name),
      });
      if (error) throw error;
      toast.success("Category order updated");
    } catch (err: any) {
      toast.error("Failed to save category order");
      await loadData();
    }
  };

  const handleSubCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = subCategories.findIndex(
      (s) => s.name === String(active.id),
    );
    const newIndex = subCategories.findIndex((s) => s.name === String(over.id));
    const newOrder = arrayMove(subCategories, oldIndex, newIndex);

    setSubCategories(newOrder);

    try {
      const { error } = await client.rpc("reorder_subcategories", {
        p_ordered_names: newOrder.map((s) => s.name),
      });
      if (error) throw error;
      toast.success("Subcategory order updated");
    } catch (err: any) {
      toast.error("Failed to save subcategory order");
      await loadData();
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (authLoading || !accessReady) return <AdminContentLoading />;
  if (!user || !isAllowed) return null;

  return (
    <>
      <AdminPageShell>
        <div className="flex flex-col min-h-0 flex-1">
          <AdminStickyToolbar
            tabs={
              <AdminTabs
                value={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    value: "categories",
                    label: "Categories",
                    icon: FolderOpen,
                  },
                  { value: "subcategories", label: "Subcategories", icon: Tag },
                ]}
              />
            }
            actions={
              activeTab === "categories" ? (
                <Button
                  onClick={handleOpenAddCategory}
                  size="sm"
                  className="flex items-center gap-1.5 font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  Add Category
                </Button>
              ) : (
                <Button
                  onClick={handleOpenAddSubCategory}
                  size="sm"
                  className="flex items-center gap-1.5 font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  Add Subcategory
                </Button>
              )
            }
          />

          {isLoading ? (
            <AdminContentLoading />
          ) : activeTab === "categories" ? (
            <AdminDataSurface
              empty={
                categories.length === 0 ? (
                  <AdminEmptyState
                    title="No categories yet"
                    description="Add your first category to get started."
                  />
                ) : null
              }
            >
              <DndContext
                collisionDetection={closestCenter}
                sensors={sensors}
                onDragEnd={handleCategoryDragEnd}
              >
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200/70 dark:border-gray-800/70">
                      <th className="h-10 w-10 pl-4 pr-2" />
                      <th className="h-10 w-full px-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Name
                      </th>
                      <th className="h-10 whitespace-nowrap px-3 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Color
                      </th>
                      <th className="h-10 whitespace-nowrap pl-3 pr-4 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <SortableContext
                    items={categories.map((c) => c.name)}
                    strategy={verticalListSortingStrategy}
                  >
                    <tbody>
                      {categories.map((cat) => (
                        <SortableCategoryRow
                          key={cat.name}
                          category={cat}
                          onEdit={() => handleOpenEditCategory(cat)}
                          onDelete={() => handleOpenDeleteCategory(cat.name)}
                        />
                      ))}
                    </tbody>
                  </SortableContext>
                </table>
              </DndContext>
            </AdminDataSurface>
          ) : (
            <AdminDataSurface
              empty={
                subCategories.length === 0 ? (
                  <AdminEmptyState
                    title="No subcategories yet"
                    description="Add your first subcategory to get started."
                  />
                ) : null
              }
            >
              <DndContext
                collisionDetection={closestCenter}
                sensors={sensors}
                onDragEnd={handleSubCategoryDragEnd}
              >
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200/70 dark:border-gray-800/70">
                      <th className="h-10 w-10 pl-4 pr-2" />
                      <th className="h-10 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Name
                      </th>
                      <th className="h-10 pl-3 pr-4 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <SortableContext
                    items={subCategories.map((s) => s.name)}
                    strategy={verticalListSortingStrategy}
                  >
                    <tbody>
                      {subCategories.map((sub) => (
                        <SortableSubCategoryRow
                          key={sub.name}
                          subCategory={sub}
                          onEdit={() => handleOpenEditSubCategory(sub)}
                          onDelete={() => handleOpenDeleteSubCategory(sub.name)}
                        />
                      ))}
                    </tbody>
                  </SortableContext>
                </table>
              </DndContext>
            </AdminDataSurface>
          )}
        </div>
      </AdminPageShell>

      {/* ── Category dialog ── */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Category" : "Add New Category"}
            </DialogTitle>
            <DialogDescription>
              Create or edit a category. Name must match values configured in
              existing challenges if linking.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Name
              </label>
              <Input
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                disabled={isEditMode}
                placeholder="e.g. Crypto, Web, Pwn"
                className="text-xs bg-transparent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Description
              </label>
              <Textarea
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Helpful details about this category..."
                className="text-xs bg-transparent min-h-[70px] resize-none"
              />
            </div>

            {/* Icon picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Select Icon
              </label>
              <div className="grid grid-cols-7 gap-2 max-h-[140px] overflow-y-auto scroll-hidden p-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/10">
                {CTF_ICONS.map((ico) => (
                  <button
                    key={ico.name}
                    type="button"
                    onClick={() => setCatIcon(ico.name)}
                    className={`flex items-center justify-center p-1.5 rounded-lg border transition-all ${
                      catIcon === ico.name
                        ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 hover:bg-gray-150 dark:hover:bg-gray-800/60"
                    }`}
                    title={ico.label}
                  >
                    <RenderLucideIcon name={ico.name} className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Select Color Theme
              </label>
              <div className="flex flex-wrap gap-2 max-h-[88px] overflow-y-auto scroll-hidden p-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/10">
                {THEME_COLORS.map((col) => (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => setCatColor(col.name)}
                    className={`h-6 w-6 rounded-full ${col.dot} border-2 transition-all flex items-center justify-center ${
                      catColor === col.name
                        ? "border-white dark:border-gray-900 scale-110 shadow-md"
                        : "border-transparent hover:scale-105"
                    }`}
                    title={col.name}
                  >
                    {catColor === col.name && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-gray-900" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              onClick={() => setCategoryDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCategory}
              className="text-xs font-semibold px-4"
            >
              Save Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Subcategory dialog ── */}
      <Dialog
        open={subCategoryDialogOpen}
        onOpenChange={setSubCategoryDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Subcategory" : "Add New Subcategory"}
            </DialogTitle>
            <DialogDescription>
              Create or edit a global subcategory tag.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Name
              </label>
              <Input
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                disabled={isEditMode}
                placeholder="e.g. fundamentals, crypto, intro"
                className="text-xs bg-transparent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Description
              </label>
              <Textarea
                value={subDesc}
                onChange={(e) => setSubDesc(e.target.value)}
                placeholder="Helpful details about this subcategory..."
                className="text-xs bg-transparent min-h-[70px] resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Sort Order (Optional)
              </label>
              <Input
                type="number"
                value={subSortOrder}
                onChange={(e) =>
                  setSubSortOrder(
                    e.target.value !== "" ? Number(e.target.value) : "",
                  )
                }
                placeholder="Defaults to auto"
                className="text-xs bg-transparent"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              onClick={() => setSubCategoryDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSubCategory}
              className="text-xs font-semibold px-4"
            >
              Save Subcategory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete category confirm ── */}
      <Dialog
        open={deleteCategoryDialogOpen}
        onOpenChange={setDeleteCategoryDialogOpen}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-500">Delete Category?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete category{" "}
              <strong>{selectedCategoryName}</strong>? This action cannot be
              undone and will fail if challenges are currently referencing it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              onClick={() => setDeleteCategoryDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteCategory}
              className="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white px-4"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete subcategory confirm ── */}
      <Dialog
        open={deleteSubCategoryDialogOpen}
        onOpenChange={setDeleteSubCategoryDialogOpen}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-500">
              Delete Subcategory?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete subcategory{" "}
              <strong>{selectedSubCategoryName}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              onClick={() => setDeleteSubCategoryDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteSubCategory}
              className="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white px-4"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
