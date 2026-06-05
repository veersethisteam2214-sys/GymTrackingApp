import type { CategoryMeta } from "@/lib/types";

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "progress_photo",
    label: "Progress picture proof",
    shortLabel: "Progress",
    helper: "Fully clothed progress or gym check-in proof photo.",
    accent: "bg-leaf"
  },
  {
    id: "treadmill_photo",
    label: "Cardio proof",
    shortLabel: "Cardio",
    helper: "Treadmill screen, timer, or cardio summary photo.",
    accent: "bg-sky"
  },
  {
    id: "weight_scale_photo",
    label: "Weight entry",
    shortLabel: "Weight",
    helper: "Enter today's weight. No image required.",
    accent: "bg-sun"
  },
  {
    id: "protein_shake_photo",
    label: "Protein proof",
    shortLabel: "Protein",
    helper: "Protein shake or prepared protein photo.",
    accent: "bg-clay"
  }
];

export const CATEGORY_IDS = CATEGORIES.map((category) => category.id);
