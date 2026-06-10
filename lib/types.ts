export type CheckInCategory =
  | "progress_photo"
  | "treadmill_photo"
  | "weight_scale_photo"
  | "protein_shake_photo"
  | "group_challenge_ab_photo"
  | "weekly_progress_photo";

export type ItemStatus = "missing" | "uploaded" | "excused";
export type DailyStatus = "missing" | "partial" | "complete" | "excused";

export type Profile = {
  id: string;
  display_name: string;
  starting_weight: number | null;
  target_weight: number | null;
  target_date: string | null;
  weight_unit: string;
  goal_mode: "cutting" | "bulking";
  gym_routine: string | null;
  cardio_routine: string | null;
  email: string | null;
  username: string | null;
  password_hash: string | null;
  password_salt: string | null;
  login_updated_at: string | null;
  avatar_url: string | null;
  avatarSignedUrl?: string | null;
  created_at: string;
  updated_at: string;
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

export type Challenge = {
  id: string;
  title: string;
  description: string | null;
  challenge_type: string;
  target_value: number | null;
  target_unit: string | null;
  start_date: string | null;
  end_date: string | null;
  created_by_profile_id: string | null;
  created_at: string;
};

export type Recommendation = {
  id: string;
  created_by_profile_id: string | null;
  title: string;
  category: string | null;
  note: string | null;
  link_url: string | null;
  storage_path: string | null;
  audience_type?: "everyone" | "specific";
  target_profile_ids?: string[] | null;
  signedUrl?: string | null;
  created_at: string;
  profile?: Pick<Profile, "display_name" | "avatarSignedUrl"> | null;
};

export type GroupNotification = {
  id: string;
  actor_profile_id: string | null;
  target_profile_id: string | null;
  notification_type: "upload" | "recommendation" | "challenge" | "system";
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: Pick<Profile, "display_name" | "avatarSignedUrl"> | null;
  read: boolean;
};

export type FeatureAnnouncement = {
  id: string;
  title: string;
  body: string;
  active_on: string;
  created_at: string;
};
