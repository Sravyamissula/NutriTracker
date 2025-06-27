
export type FitnessModeId = 'maintenance' | 'weightLoss' | 'muscleGain';

export interface FitnessMode {
  id: FitnessModeId;
  labelKey: string; // Translation key for the label
  calorieAdjustment: number; // e.g., 0 for maintenance, -300 for weight loss, +300 for muscle gain
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: string; // e.g., "100g", "1 serving"
  timestamp?: number;
}

export interface NutritionalInfo {
  name: string;
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fat: number; // in grams
  serving_size_g?: number; // Optional, as Gemini might not always provide it
}

export interface DailyLogEntry extends FoodItem {}

export interface UserGoal {
  baseCalories: number; // User's self-defined base daily calorie goal
}

export interface GroundingChunk {
  web?: {
    uri: string; 
    title?: string; 
  };
}

// For User Profile Customization
export type ActivityLevelId = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';

export interface ActivityLevel {
  id: ActivityLevelId;
  labelKey: string; // Translation key
}

export interface DietaryPreference {
  id: string; // e.g., 'vegan', 'gluten_free', or 'other:custom_pref'
  labelKey: string; // Translation key for common ones, or the custom text itself for 'other'
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  age?: number;
  weight?: number; // in kg
  height?: number; // in cm
  dietaryPreferences?: string[]; // Array of DietaryPreference ids (or custom strings like "other:No shellfish")
  activityLevel?: ActivityLevelId;
}

// New types for Meal Calendar / Planner
export type MealTypeId = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealType {
  id: MealTypeId;
  labelKey: string; // Translation key e.g., "mealTypes.breakfast"
}

export interface PlannedMealItem extends FoodItem {
  plannedDate: string; // YYYY-MM-DD
  mealType: MealTypeId;
  // 'id' will be unique for this planned instance, 'name', 'calories', etc., come from FoodItem
}

// Types for Progress Tracker
export interface Milestone {
  id: string;
  achievedDate: number; // Timestamp of when it was achieved
}

export interface MilestoneDefinition {
  id: string;
  nameKey: string; // Translation key for the milestone name
  descriptionKey: string; // Translation key for the milestone description
  icon: JSX.Element; // Icon component for the badge
  condition: (log: DailyLogEntry[], streak: number, dailyLogContextFunctions: any) 
    => boolean;
}

// Type for Micronutrient Analysis
export interface MicronutrientAnalysisResponse {
  analysisText: string;
}

// Types for AI Meal Suggestions
export interface AISuggestedMeal {
  name: string;
  description: string;
  estimatedCalories: number;
  estimatedProtein: number;
  estimatedCarbs: number;
  estimatedFat: number;
}

export interface MealSuggestionResponse {
  suggestions: AISuggestedMeal[];
  sources?: GroundingChunk[];
}

// Types for AI Diet Plan Generator
export interface PlannedMealDetail {
  name: string;
  description?: string;
  estimatedCalories: number;
  estimatedProtein: number;
  estimatedCarbs: number;
  estimatedFat: number;
}

export interface DietPlanDay {
  dayLabel: string; // e.g., "Day 1" or a specific date if weekly
  meals: {
    breakfast: PlannedMealDetail[];
    lunch: PlannedMealDetail[];
    dinner: PlannedMealDetail[];
    snacks: PlannedMealDetail[];
  };
  dailyTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface DietPlanResponse {
  plan: DietPlanDay[];
  notes?: string; // Optional general notes from the AI
  sources?: GroundingChunk[];
}

// Types for AI Chatbot
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  sources?: GroundingChunk[];
}
export interface GeminiChatInstance {
   sendMessage: (message: string) => Promise<{ text: string; sources?: GroundingChunk[] }>;
}

// Water & Sleep Tracking Types
export interface WaterIntakeRecord {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number; 
  unit: 'ml' | 'oz';
  timestamp: number; // When it was logged
}

export interface SleepRecord {
  id: string;
  date: string; // Date the sleep period ended (i.e., morning of)
  durationHours: number;
  quality?: 'poor' | 'fair' | 'good'; // Optional
  notes?: string; // Optional
  timestamp: number; // When it was logged
}

// Meal Sharing Feed
export interface SharedMealItem extends DailyLogEntry {
  sharedByDisplayName: string;
  sharedByUid: string;
  sharedAt: number; // Timestamp of when it was shared
}

// Challenges & Leaderboards
export interface Challenge {
  id: string; // Corresponds to ChallengeDefinition id
  completedDate: number; // Timestamp
  pointsAwarded: number;
}

export interface ChallengeDefinition {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: JSX.Element;
  rewardPoints: number;
  // Context functions provides specific parts of DailyLogContextType needed by conditions
  condition: (
    log: DailyLogEntry[], 
    streak: number, 
    contextFns: Pick<DailyLogContextType, 'getDistinctFoodNamesOverDays' | 'plannedMeals' | 'userGoal' | 'currentFitnessMode' | 'waterIntakeRecords' | 'sleepRecords'>,
    completedChallenges: Challenge[],
    userProfile?: User | null 
  ) => boolean;
}

// Forward declaration for DailyLogContextType for ChallengeDefinition
export interface DailyLogContextType {
  dailyLog: DailyLogEntry[];
  userGoal: UserGoal;
  effectiveCalorieGoal: number;
  currentFitnessMode: FitnessModeId;
  addFoodToLog: (food: FoodItem) => void;
  getTodaysIntake: () => { calories: number; protein: number; carbs: number; fat: number };
  getWeeklyIntakeData: () => { name: string; calories: number }[];
  getDetailedWeeklyLog: () => Record<string, DailyLogEntry[]>;
  getHistoricalIntakeSeries: (numberOfDays: number) => any; // Replace 'any' with NutrientSeries if defined elsewhere
  setBaseCalorieGoal: (calories: number) => void;
  removeFoodFromLog: (foodId: string) => void;
  setFitnessMode: (modeId: FitnessModeId) => void;
  isDailyLogLoading: boolean;

  plannedMeals: PlannedMealItem[];
  addPlannedMeal: (item: Omit<PlannedMealItem, 'id' | 'timestamp'>) => void;
  removePlannedMeal: (plannedMealId: string) => void;
  getPlannedMealsForDate: (date: string) => PlannedMealItem[];
  getPlannedMealsForDateAndType: (date: string, mealType: MealTypeId) => PlannedMealItem[];
  isPlannedMealsLoading: boolean;

  loggingStreak: number;
  achievedMilestones: Milestone[];
  getDistinctFoodNamesOverDays: (numberOfDays: number) => string[];
  isMilestonesLoading: boolean;

  waterIntakeRecords: WaterIntakeRecord[];
  addWaterIntake: (amount: number, unit: 'ml' | 'oz') => void;
  getWaterIntakeForDate: (date: string) => WaterIntakeRecord[];
  removeWaterIntake: (recordId: string) => void;
  isWaterRecordsLoading: boolean;

  sleepRecords: SleepRecord[];
  addSleepRecord: (durationHours: number, date?: string, quality?: 'poor' | 'fair' | 'good', notes?: string) => void;
  getSleepRecordForDate: (date: string) => SleepRecord | null;
  removeSleepRecord: (recordId: string) => void;
  isSleepRecordsLoading: boolean;

  // Meal Sharing Feed
  sharedMealsFeed: SharedMealItem[];
  shareMeal: (meal: DailyLogEntry) => void;
  removeSharedMeal: (sharedMealId: string) => void;
  isSharedFeedLoading: boolean;

  // Challenges & Points
  completedChallenges: Challenge[];
  userPoints: number;
  checkAndCompleteChallenges: () => void; // Added this for explicitness, even if called internally
  isChallengesLoading: boolean;
}
