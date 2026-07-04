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
