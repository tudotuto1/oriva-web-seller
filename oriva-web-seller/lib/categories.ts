import { createClient } from "@/lib/supabase/server";

export type Category = {
  id: string;
  slug: string;
  name_fr: string;
  display_order: number;
};

export async function fetchActiveCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name_fr, display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("fetchActiveCategories error:", error.message);
    return [];
  }
  return (data ?? []) as Category[];
}
