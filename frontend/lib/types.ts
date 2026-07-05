export type GoalType = 'weight_loss' | 'maintenance' | 'weight_gain';

export interface UserProfile {
  id: number;
  device_id: string;
  nickname?: string;
  gender: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  goal: GoalType;
  skeletal_muscle_mass?: number;
  body_fat_mass?: number;
  body_fat_percentage?: number;
  bmr?: number;
  daily_calories?: number;
  carbs_g?: number;
  protein_g?: number;
  fat_g?: number;
}

export interface MealRecord {
  id: number;
  meal_time: string;
  meal_date: string;
  image_url?: string;
  predicted_food?: string;
  confidence?: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  created_at: string;
}

export interface MealSummary {
  meal_date: string;
  total_calories: number;
  total_carbs: number;
  total_protein: number;
  total_fat: number;
  meals: MealRecord[];
}

export interface NutritionProgress {
  label: string;
  current: number;
  target: number;
  unit: string;
  percentage: number;
}

export interface Recommendation {
  message: string;
  suggestions: string[];
  next_meal_ideas: string[];
}

export interface DashboardData {
  user: UserProfile;
  summary: MealSummary;
  progress: NutritionProgress[];
  recommendation: Recommendation;
}

export interface UserSetupPayload {
  nickname?: string;
  gender: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  goal: GoalType;
  skeletal_muscle_mass?: number;
  body_fat_mass?: number;
  body_fat_percentage?: number;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface WorkoutChatResponse {
  message: ChatMessage;
  history: ChatMessage[];
  provider: string;
}

export interface WorkoutChatHistoryResponse {
  history: ChatMessage[];
  provider: string;
}
