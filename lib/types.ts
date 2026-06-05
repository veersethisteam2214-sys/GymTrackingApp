export type CheckInCategory =
  | "progress_photo"
  | "treadmill_photo"
  | "weight_scale_photo"
  | "protein_shake_photo";

export type ItemStatus = "missing" | "uploaded" | "excused";
export type DailyStatus = "missing" | "partial" | "complete" | "excused";

export type Profile = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

export type DailyCheckIn = {
  id: string;
  user_id: string;
  checkin_date: string;
  overall_status: DailyStatus;
  is_rest_day: boolean;
  rest_day_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type CheckInItem = {
  id: string;
  checkin_id: string;
  user_id: string;
  category: CheckInCategory;
  status: ItemStatus;
  storage_path: string | null;
  original_filename: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  uploaded_at: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  signedUrl?: string | null;
};

export type WeightEntry = {
  id: string;
  user_id: string;
  checkin_id: string;
  weight_value: number;
  weight_unit: string;
  measured_at: string;
};

export type CardioEntry = {
  id: string;
  user_id: string;
  checkin_id: string;
  treadmill_minutes: number | null;
  treadmill_distance: number | null;
  distance_unit: string | null;
  calories: number | null;
};

export type CategoryMeta = {
  id: CheckInCategory;
  label: string;
  shortLabel: string;
  helper: string;
  accent: string;
};

