
import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { DailyLogEntry, UserGoal, FoodItem, FitnessModeId, PlannedMealItem, MealTypeId, Milestone, MilestoneDefinition, WaterIntakeRecord, SleepRecord, SharedMealItem, Challenge, ChallengeDefinition, User } from '../types';
import { FITNESS_MODES, MILESTONE_DEFINITIONS, CHALLENGE_DEFINITIONS } from '../constants';
import i18n from '../src/i18n.js';
import { useAuth } from './AuthContext';
import { RegressionDataPoint } from '../src/utils/regression';

interface NutrientSeries {
  calories: RegressionDataPoint[];
  protein: RegressionDataPoint[];
  carbs: RegressionDataPoint[];
  fat: RegressionDataPoint[];
}

export interface DailyLogContextType {
  dailyLog: DailyLogEntry[];
  userGoal: UserGoal;
  effectiveCalorieGoal: number;
  currentFitnessMode: FitnessModeId;
  addFoodToLog: (food: FoodItem) => void;
  getTodaysIntake: () => { calories: number; protein: number; carbs: number; fat: number };
  getWeeklyIntakeData: () => { name: string; calories: number }[];
  getDetailedWeeklyLog: () => Record<string, DailyLogEntry[]>;
  getHistoricalIntakeSeries: (numberOfDays: number) => NutrientSeries;
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
  checkAndCompleteChallenges: () => void;
  isChallengesLoading: boolean;
}

const DailyLogContext = createContext<DailyLogContextType | undefined>(undefined);

const DEFAULT_GOAL: UserGoal = { baseCalories: 2000 };
const DEFAULT_FITNESS_MODE: FitnessModeId = 'maintenance';

export const DailyLogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [dailyLog, setDailyLog] = useState<DailyLogEntry[]>([]);
  const [userGoal, setUserGoal] = useState<UserGoal>(DEFAULT_GOAL);
  const [currentFitnessMode, setCurrentFitnessMode] = useState<FitnessModeId>(DEFAULT_FITNESS_MODE);
  const [effectiveCalorieGoal, setEffectiveCalorieGoal] = useState<number>(DEFAULT_GOAL.baseCalories);
  const [isDailyLogLoading, setIsDailyLogLoading] = useState(true);

  const [plannedMeals, setPlannedMeals] = useState<PlannedMealItem[]>([]);
  const [isPlannedMealsLoading, setIsPlannedMealsLoading] = useState(true);

  const [loggingStreak, setLoggingStreak] = useState<number>(0);
  const [achievedMilestones, setAchievedMilestones] = useState<Milestone[]>([]);
  const [isMilestonesLoading, setIsMilestonesLoading] = useState(true);

  const [waterIntakeRecords, setWaterIntakeRecords] = useState<WaterIntakeRecord[]>([]);
  const [isWaterRecordsLoading, setIsWaterRecordsLoading] = useState(true);
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [isSleepRecordsLoading, setIsSleepRecordsLoading] = useState(true);

  // Meal Sharing Feed State
  const [sharedMealsFeed, setSharedMealsFeed] = useState<SharedMealItem[]>([]);
  const [isSharedFeedLoading, setIsSharedFeedLoading] = useState(true);

  // Challenges & Points State
  const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [isChallengesLoading, setIsChallengesLoading] = useState(true);


  const getLocalStorageKey = useCallback((baseKey: string) => {
    return currentUser ? `${baseKey}_${currentUser.uid}` : null;
  }, [currentUser]);

  useEffect(() => {
    setIsDailyLogLoading(true);
    setIsPlannedMealsLoading(true);
    setIsMilestonesLoading(true);
    setIsWaterRecordsLoading(true);
    setIsSleepRecordsLoading(true);
    setIsSharedFeedLoading(true);
    setIsChallengesLoading(true);

    if (currentUser) {
      const logKey = getLocalStorageKey('dailyLog');
      const goalKey = getLocalStorageKey('userGoal');
      const modeKey = getLocalStorageKey('currentFitnessMode');
      const plannedMealsKey = getLocalStorageKey('plannedMeals');
      const milestonesKey = getLocalStorageKey('achievedMilestones');
      const waterKey = getLocalStorageKey('waterIntakeRecords');
      const sleepKey = getLocalStorageKey('sleepRecords');
      const sharedFeedKey = getLocalStorageKey('sharedMealsFeed');
      const completedChallengesKey = getLocalStorageKey('completedChallenges');
      const userPointsKey = getLocalStorageKey('userPoints');

      const savedLog = logKey ? localStorage.getItem(logKey) : null;
      setDailyLog(savedLog ? JSON.parse(savedLog) : []);

      const savedGoal = goalKey ? localStorage.getItem(goalKey) : null;
      setUserGoal(savedGoal ? JSON.parse(savedGoal) : DEFAULT_GOAL);
      
      const savedMode = modeKey ? localStorage.getItem(modeKey) as FitnessModeId | null : null;
      setCurrentFitnessMode(savedMode || DEFAULT_FITNESS_MODE);

      const savedPlannedMeals = plannedMealsKey ? localStorage.getItem(plannedMealsKey) : null;
      setPlannedMeals(savedPlannedMeals ? JSON.parse(savedPlannedMeals) : []);
      
      const savedMilestones = milestonesKey ? localStorage.getItem(milestonesKey) : null;
      setAchievedMilestones(savedMilestones ? JSON.parse(savedMilestones) : []);

      const savedWater = waterKey ? localStorage.getItem(waterKey) : null;
      setWaterIntakeRecords(savedWater ? JSON.parse(savedWater) : []);

      const savedSleep = sleepKey ? localStorage.getItem(sleepKey) : null;
      setSleepRecords(savedSleep ? JSON.parse(savedSleep) : []);
      
      const savedSharedFeed = sharedFeedKey ? localStorage.getItem(sharedFeedKey) : null;
      setSharedMealsFeed(savedSharedFeed ? JSON.parse(savedSharedFeed) : []);

      const savedCompletedChallenges = completedChallengesKey ? localStorage.getItem(completedChallengesKey) : null;
      setCompletedChallenges(savedCompletedChallenges ? JSON.parse(savedCompletedChallenges) : []);
      
      const savedUserPoints = userPointsKey ? localStorage.getItem(userPointsKey) : null;
      setUserPoints(savedUserPoints ? JSON.parse(savedUserPoints) : 0);

    } else {
      setDailyLog([]);
      setUserGoal(DEFAULT_GOAL);
      setCurrentFitnessMode(DEFAULT_FITNESS_MODE);
      setPlannedMeals([]);
      setAchievedMilestones([]);
      setWaterIntakeRecords([]);
      setSleepRecords([]);
      setSharedMealsFeed([]);
      setCompletedChallenges([]);
      setUserPoints(0);
    }
    setIsDailyLogLoading(false);
    setIsPlannedMealsLoading(false);
    setIsMilestonesLoading(false);
    setIsWaterRecordsLoading(false);
    setIsSleepRecordsLoading(false);
    setIsSharedFeedLoading(false);
    setIsChallengesLoading(false);
  }, [currentUser, getLocalStorageKey]);

  useEffect(() => { if (currentUser && !isDailyLogLoading) { const k = getLocalStorageKey('dailyLog'); if (k) localStorage.setItem(k, JSON.stringify(dailyLog)); }}, [dailyLog, currentUser, getLocalStorageKey, isDailyLogLoading]);
  useEffect(() => { if (currentUser && !isDailyLogLoading) { const gk = getLocalStorageKey('userGoal'); if (gk) localStorage.setItem(gk, JSON.stringify(userGoal)); const mk = getLocalStorageKey('currentFitnessMode'); if (mk) localStorage.setItem(mk, currentFitnessMode); }}, [userGoal, currentFitnessMode, currentUser, getLocalStorageKey, isDailyLogLoading]);
  useEffect(() => { if (currentUser && !isPlannedMealsLoading) { const k = getLocalStorageKey('plannedMeals'); if (k) localStorage.setItem(k, JSON.stringify(plannedMeals)); }}, [plannedMeals, currentUser, getLocalStorageKey, isPlannedMealsLoading]);
  useEffect(() => { if (currentUser && !isMilestonesLoading) { const k = getLocalStorageKey('achievedMilestones'); if (k) localStorage.setItem(k, JSON.stringify(achievedMilestones)); }}, [achievedMilestones, currentUser, getLocalStorageKey, isMilestonesLoading]);
  useEffect(() => { if (currentUser && !isWaterRecordsLoading) { const k = getLocalStorageKey('waterIntakeRecords'); if (k) localStorage.setItem(k, JSON.stringify(waterIntakeRecords)); }}, [waterIntakeRecords, currentUser, getLocalStorageKey, isWaterRecordsLoading]);
  useEffect(() => { if (currentUser && !isSleepRecordsLoading) { const k = getLocalStorageKey('sleepRecords'); if (k) localStorage.setItem(k, JSON.stringify(sleepRecords)); }}, [sleepRecords, currentUser, getLocalStorageKey, isSleepRecordsLoading]);
  useEffect(() => { if (currentUser && !isSharedFeedLoading) { const k = getLocalStorageKey('sharedMealsFeed'); if (k) localStorage.setItem(k, JSON.stringify(sharedMealsFeed)); }}, [sharedMealsFeed, currentUser, getLocalStorageKey, isSharedFeedLoading]);
  useEffect(() => { if (currentUser && !isChallengesLoading) { const cck = getLocalStorageKey('completedChallenges'); if (cck) localStorage.setItem(cck, JSON.stringify(completedChallenges)); const upk = getLocalStorageKey('userPoints'); if (upk) localStorage.setItem(upk, JSON.stringify(userPoints)); }}, [completedChallenges, userPoints, currentUser, getLocalStorageKey, isChallengesLoading]);
  
  useEffect(() => {
    const mode = FITNESS_MODES.find(m => m.id === currentFitnessMode);
    const adjustment = mode ? mode.calorieAdjustment : 0;
    setEffectiveCalorieGoal(Math.max(0, userGoal.baseCalories + adjustment));
  }, [userGoal, currentFitnessMode]);

  const addFoodToLog = useCallback((food: FoodItem) => {
    if (!currentUser) return;
    const newEntry: DailyLogEntry = { ...food, id: `log-${Date.now().toString()}-${Math.random().toString(36).substring(2,7)}`, timestamp: Date.now() };
    setDailyLog(prevLog => [...prevLog, newEntry]);
  }, [currentUser]);
  
  const removeFoodFromLog = useCallback((foodId: string) => {
    if (!currentUser) return;
    setDailyLog(prevLog => prevLog.filter(item => item.id !== foodId));
  }, [currentUser]);

  const getTodaysIntake = useCallback(() => {
    const today = new Date().toDateString();
    return dailyLog
      .filter(entry => entry.timestamp && new Date(entry.timestamp).toDateString() === today)
      .reduce(
        (acc, entry) => ({
          calories: acc.calories + entry.calories,
          protein: acc.protein + entry.protein,
          carbs: acc.carbs + entry.carbs,
          fat: acc.fat + entry.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
  }, [dailyLog]);

  const getWeeklyIntakeData = useCallback(() => {
    const today = new Date();
    const weekData: { name: string; calories: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toDateString();
      const dayShortName = date.toLocaleDateString(i18n.language, { weekday: 'short' }); 
      
      const dailyTotal = dailyLog
        .filter(entry => entry.timestamp && new Date(entry.timestamp).toDateString() === dateString)
        .reduce((sum, entry) => sum + entry.calories, 0);
      
      weekData.push({ name: dayShortName, calories: dailyTotal });
    }
    return weekData;
  }, [dailyLog, i18n.language]);

  const getDetailedWeeklyLog = useCallback((): Record<string, DailyLogEntry[]> => {
    const today = new Date();
    const weeklyLogDetails: Record<string, DailyLogEntry[]> = {};
    const dayLabels: string[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const formattedDate = date.toLocaleDateString(i18n.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const dateStringForFilter = date.toDateString();
      dayLabels.push(formattedDate); 

      const entriesForDay = dailyLog
        .filter(entry => entry.timestamp && new Date(entry.timestamp).toDateString() === dateStringForFilter)
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)); 
      
      weeklyLogDetails[formattedDate] = entriesForDay;
    }
    const orderedWeeklyLogDetails: Record<string, DailyLogEntry[]> = {};
    dayLabels.forEach(label => {
        orderedWeeklyLogDetails[label] = weeklyLogDetails[label] || [];
    });
    return orderedWeeklyLogDetails;
  }, [dailyLog, i18n.language]);

  const getHistoricalIntakeSeries = useCallback((numberOfDays: number): NutrientSeries => {
    const series: NutrientSeries = { calories: [], protein: [], carbs: [], fat: [] };
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

    for (let i = 0; i < numberOfDays; i++) {
      const date = new Date(todayStart);
      date.setDate(todayStart.getDate() - (numberOfDays - 1 - i)); 
      const dateString = date.toDateString();
      const dailyTotals = dailyLog
        .filter(entry => entry.timestamp && new Date(entry.timestamp).toDateString() === dateString)
        .reduce((acc, entry) => ({
            calories: acc.calories + entry.calories, protein: acc.protein + entry.protein,
            carbs: acc.carbs + entry.carbs, fat: acc.fat + entry.fat,
          }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
      series.calories.push({ x: i, y: dailyTotals.calories });
      series.protein.push({ x: i, y: dailyTotals.protein });
      series.carbs.push({ x: i, y: dailyTotals.carbs });
      series.fat.push({ x: i, y: dailyTotals.fat });
    }
    return series;
  }, [dailyLog]);

  const setBaseCalorieGoal = useCallback((calories: number) => {
    if (!currentUser) return;
    setUserGoal({ baseCalories: calories });
  }, [currentUser]);

  const setFitnessMode = useCallback((modeId: FitnessModeId) => {
    if (!currentUser) return;
    setCurrentFitnessMode(modeId);
  }, [currentUser]);

  const addPlannedMeal = useCallback((item: Omit<PlannedMealItem, 'id' | 'timestamp'>) => {
    if (!currentUser) return;
    const newPlannedMeal: PlannedMealItem = { ...item, id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` };
    setPlannedMeals(prev => [...prev, newPlannedMeal]);
  }, [currentUser]);

  const removePlannedMeal = useCallback((plannedMealId: string) => {
    if (!currentUser) return;
    setPlannedMeals(prev => prev.filter(item => item.id !== plannedMealId));
  }, [currentUser]);

  const getPlannedMealsForDate = useCallback((date: string): PlannedMealItem[] => {
    return plannedMeals.filter(item => item.plannedDate === date);
  }, [plannedMeals]);

  const getPlannedMealsForDateAndType = useCallback((date: string, mealType: MealTypeId): PlannedMealItem[] => {
    return plannedMeals.filter(item => item.plannedDate === date && item.mealType === mealType);
  }, [plannedMeals]);

  const calculateLoggingStreak = useCallback(() => {
    if (!currentUser || dailyLog.length === 0) return 0;
    const sortedLog = [...dailyLog].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const uniqueLogDays = new Set<string>();
    sortedLog.forEach(entry => {
      if (entry.timestamp) {
        uniqueLogDays.add(new Date(entry.timestamp).toDateString());
      }
    });

    if (!uniqueLogDays.has(currentDate.toDateString())) { 
      currentDate.setDate(currentDate.getDate() - 1); 
      if (!uniqueLogDays.has(currentDate.toDateString())) return 0; 
    }
    
    while (uniqueLogDays.has(currentDate.toDateString())) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }
    return streak;
  }, [dailyLog, currentUser]);

  const checkAndAwardMilestones = useCallback(() => {
    if (!currentUser || isMilestonesLoading || isDailyLogLoading || isPlannedMealsLoading) return;
    const currentStreak = calculateLoggingStreak(); 
    const newAchieved: Milestone[] = [];
    const existingAchievedIds = new Set(achievedMilestones.map(m => m.id));

    MILESTONE_DEFINITIONS.forEach(def => {
      if (existingAchievedIds.has(def.id)) { 
        newAchieved.push(achievedMilestones.find(m => m.id === def.id)!);
      } else {
        const contextFunctionsForMilestones = { plannedMeals, userGoal, currentFitnessMode };
        if (def.condition(dailyLog, currentStreak, contextFunctionsForMilestones)) {
          newAchieved.push({ id: def.id, achievedDate: Date.now() });
        }
      }
    });
    
    if (newAchieved.length !== achievedMilestones.length || !newAchieved.every(m => achievedMilestones.some(am => am.id === m.id))) {
        setAchievedMilestones(newAchieved.sort((a,b) => a.achievedDate - b.achievedDate));
    }
  }, [currentUser, dailyLog, achievedMilestones, calculateLoggingStreak, plannedMeals, userGoal, currentFitnessMode, isMilestonesLoading, isDailyLogLoading, isPlannedMealsLoading]);

  const getDistinctFoodNamesOverDays = useCallback((numberOfDays: number): string[] => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - numberOfDays);
    const recentEntries = dailyLog.filter(entry => entry.timestamp && new Date(entry.timestamp) >= cutoffDate);
    return Array.from(new Set(recentEntries.map(entry => entry.name.trim().toLowerCase())));
  }, [dailyLog]);

  const addWaterIntake = useCallback((amount: number, unit: 'ml' | 'oz') => {
    if (!currentUser) return;
    const newRecord: WaterIntakeRecord = { id: `water-${Date.now()}-${Math.random().toString(36).substring(2,7)}`, date: new Date().toISOString().split('T')[0], amount, unit, timestamp: Date.now() };
    setWaterIntakeRecords(prev => [...prev, newRecord]);
  }, [currentUser]);
  const getWaterIntakeForDate = useCallback((date: string): WaterIntakeRecord[] => waterIntakeRecords.filter(r => r.date === date), [waterIntakeRecords]);
  const removeWaterIntake = useCallback((recordId: string) => { if (!currentUser) return; setWaterIntakeRecords(prev => prev.filter(r => r.id !== recordId)); }, [currentUser]);
  
  const addSleepRecord = useCallback((durationHours: number, date?: string, quality?: 'poor' | 'fair' | 'good', notes?: string) => {
    if (!currentUser) return;
    const recordDate = date || new Date().toISOString().split('T')[0];
    setSleepRecords(prev => prev.filter(r => r.date !== recordDate));
    const newRecord: SleepRecord = { id: `sleep-${Date.now()}-${Math.random().toString(36).substring(2,7)}`, date: recordDate, durationHours, quality, notes, timestamp: Date.now() };
    setSleepRecords(prev => [...prev, newRecord].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, [currentUser]);
  const getSleepRecordForDate = useCallback((date: string): SleepRecord | null => sleepRecords.find(r => r.date === date) || null, [sleepRecords]);
  const removeSleepRecord = useCallback((recordId: string) => { if (!currentUser) return; setSleepRecords(prev => prev.filter(r => r.id !== recordId)); }, [currentUser]);

  // Meal Sharing Feed Functions
  const shareMeal = useCallback((meal: DailyLogEntry) => {
    if (!currentUser) return;
    const sharedItem: SharedMealItem = {
      ...meal,
      sharedByDisplayName: currentUser.displayName || currentUser.email || 'Anonymous',
      sharedByUid: currentUser.uid,
      sharedAt: Date.now(),
    };
    setSharedMealsFeed(prev => [sharedItem, ...prev.sort((a, b) => b.sharedAt - a.sharedAt)]);
  }, [currentUser]);

  const removeSharedMeal = useCallback((sharedMealId: string) => {
    if (!currentUser) return;
    setSharedMealsFeed(prev => prev.filter(item => item.id !== sharedMealId));
  }, [currentUser]);

  // Challenges & Points Functions
  const checkAndCompleteChallenges = useCallback(() => {
    if (!currentUser || isChallengesLoading || isDailyLogLoading || isPlannedMealsLoading || isWaterRecordsLoading || isSleepRecordsLoading) return;
    
    const currentStreak = loggingStreak; // Use already calculated streak
    const contextFnsForChallenges: Pick<DailyLogContextType, 'getDistinctFoodNamesOverDays' | 'plannedMeals' | 'userGoal' | 'currentFitnessMode' | 'waterIntakeRecords' | 'sleepRecords'> = {
        getDistinctFoodNamesOverDays,
        plannedMeals,
        userGoal,
        currentFitnessMode,
        waterIntakeRecords,
        sleepRecords,
    };

    let newPointsEarned = 0;
    const newlyCompletedChallenges: Challenge[] = [];

    CHALLENGE_DEFINITIONS.forEach(def => {
      const isAlreadyCompleted = completedChallenges.some(cc => cc.id === def.id);
      if (!isAlreadyCompleted) {
        if (def.condition(dailyLog, currentStreak, contextFnsForChallenges, completedChallenges, currentUser)) {
          newlyCompletedChallenges.push({ id: def.id, completedDate: Date.now(), pointsAwarded: def.rewardPoints });
          newPointsEarned += def.rewardPoints;
        }
      }
    });

    if (newlyCompletedChallenges.length > 0) {
      setCompletedChallenges(prev => [...prev, ...newlyCompletedChallenges].sort((a,b) => a.completedDate - b.completedDate));
      setUserPoints(prev => prev + newPointsEarned);
    }
  }, [currentUser, dailyLog, loggingStreak, plannedMeals, userGoal, currentFitnessMode, waterIntakeRecords, sleepRecords, getDistinctFoodNamesOverDays, completedChallenges, isChallengesLoading, isDailyLogLoading, isPlannedMealsLoading, isWaterRecordsLoading, isSleepRecordsLoading ]);


  useEffect(() => { if (!isDailyLogLoading && currentUser) { setLoggingStreak(calculateLoggingStreak()); }}, [dailyLog, calculateLoggingStreak, isDailyLogLoading, currentUser]);
  useEffect(() => { if (!isMilestonesLoading && !isDailyLogLoading && !isPlannedMealsLoading && currentUser) { checkAndAwardMilestones(); }}, [loggingStreak, dailyLog, plannedMeals, userGoal, currentFitnessMode, checkAndAwardMilestones, isMilestonesLoading, isDailyLogLoading, isPlannedMealsLoading, currentUser]);
  useEffect(() => { if (currentUser && !isChallengesLoading && !isDailyLogLoading && !isPlannedMealsLoading && !isWaterRecordsLoading && !isSleepRecordsLoading) { checkAndCompleteChallenges(); }}, [dailyLog, loggingStreak, plannedMeals, waterIntakeRecords, sleepRecords, currentUser, checkAndCompleteChallenges, isChallengesLoading, isDailyLogLoading, isPlannedMealsLoading, isWaterRecordsLoading, isSleepRecordsLoading]);


  return (
    <DailyLogContext.Provider value={{ 
        dailyLog, userGoal, effectiveCalorieGoal, currentFitnessMode,
        addFoodToLog, getTodaysIntake, getWeeklyIntakeData, getDetailedWeeklyLog, 
        getHistoricalIntakeSeries, setBaseCalorieGoal, removeFoodFromLog, setFitnessMode,
        isDailyLogLoading,
        plannedMeals, addPlannedMeal, removePlannedMeal, getPlannedMealsForDate,
        getPlannedMealsForDateAndType, isPlannedMealsLoading,
        loggingStreak, achievedMilestones, getDistinctFoodNamesOverDays, isMilestonesLoading,
        waterIntakeRecords, addWaterIntake, getWaterIntakeForDate, removeWaterIntake, isWaterRecordsLoading,
        sleepRecords, addSleepRecord, getSleepRecordForDate, removeSleepRecord, isSleepRecordsLoading,
        sharedMealsFeed, shareMeal, removeSharedMeal, isSharedFeedLoading,
        completedChallenges, userPoints, checkAndCompleteChallenges, isChallengesLoading
    }}>
      {children}
    </DailyLogContext.Provider>
  );
};

export const useDailyLog = (): DailyLogContextType => {
  const context = useContext(DailyLogContext);
  if (context === undefined) {
    throw new Error('useDailyLog must be used within a DailyLogProvider');
  }
  return context;
};
