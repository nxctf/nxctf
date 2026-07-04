"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import APP from "@/config";

export type DbCategory = {
  name: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number | null;
};

export type DbSubCategory = {
  name: string;
  description: string;
  sort_order: number | null;
};

type CategoriesContextType = {
  categories: DbCategory[];
  subCategories: DbSubCategory[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const CategoriesContext = createContext<CategoriesContextType | undefined>(
  undefined,
);

const CACHE_KEY = "nxctf_categories_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function CategoriesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [subCategories, setSubCategories] = useState<DbSubCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Use untyped client to bypass typescript database.types sync issues
  const client = supabase as any;

  const fetchFromDb = async () => {
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

      const fetchedCategories = (catRes.data || []) as DbCategory[];
      const fetchedSubCategories = (subRes.data || []) as DbSubCategory[];

      setCategories(fetchedCategories);
      setSubCategories(fetchedSubCategories);

      // Save to localStorage cache
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          categories: fetchedCategories,
          subCategories: fetchedSubCategories,
          timestamp: Date.now(),
        }),
      );
    } catch (err) {
      console.error("Failed to fetch categories/subcategories from DB:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const {
          categories: cachedCats,
          subCategories: cachedSubs,
          timestamp,
        } = JSON.parse(cached);
        setCategories(cachedCats);
        setSubCategories(cachedSubs);
        setLoading(false);

        // Check if cache has expired
        if (Date.now() - timestamp > CACHE_TTL) {
          // Revalidate in the background
          fetchFromDb();
        }
      } else {
        await fetchFromDb();
      }
    } catch {
      await fetchFromDb();
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <CategoriesContext.Provider
      value={{ categories, subCategories, loading, refresh: fetchFromDb }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error("useCategories must be used within a CategoriesProvider");
  }
  return context;
}
