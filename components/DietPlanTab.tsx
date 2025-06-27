
import React, { useState, useEffect } from 'react';
import { useDailyLog } from '../contexts/DailyLogContext';
import { geminiService } from '../services/geminiService';
import { DietPlanDay, PlannedMealDetail, NutritionalInfo, FoodItem, User } from '../types';
import { ICONS, DIET_PLAN_DURATION_OPTIONS, DEFAULT_MACRO_PERCENTAGES, DEFAULT_NUTRITION_SERVING_SIZE_G, DEFAULT_SERVING_QUANTITY } from '../constants';
import LoadingSpinner from './common/LoadingSpinner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

const DietPlanTab: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { effectiveCalorieGoal, addFoodToLog } = useDailyLog();
  const { currentUser } = useAuth(); // Get currentUser

  const [duration, setDuration] = useState<number>(DIET_PLAN_DURATION_OPTIONS[0].value);
  const [targetCalories, setTargetCalories] = useState<number>(effectiveCalorieGoal);
  const [proteinPercent, setProteinPercent] = useState<number>(DEFAULT_MACRO_PERCENTAGES.protein);
  const [carbsPercent, setCarbsPercent] = useState<number>(DEFAULT_MACRO_PERCENTAGES.carbs);
  const [fatPercent, setFatPercent] = useState<number>(DEFAULT_MACRO_PERCENTAGES.fat);
  const [cuisinePreference, setCuisinePreference] = useState<string>('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string>('');
  
  const [generatedPlan, setGeneratedPlan] = useState<DietPlanDay[] | null>(null);
  const [aiNotes, setAiNotes] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loggingMealDetails, setLoggingMealDetails] = useState<{ mealName: string; dayIndex: number; mealType: string; itemIndex: number } | null>(null);
  const [logMealStatus, setLogMealStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setTargetCalories(effectiveCalorieGoal);
  }, [effectiveCalorieGoal]);

  const handleMacroChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: string) => {
    const numValue = parseInt(value, 10);
    setter(isNaN(numValue) || numValue < 0 ? 0 : Math.min(numValue, 100));
  };
  
  const validateMacros = (): boolean => {
    const totalPercent = proteinPercent + carbsPercent + fatPercent;
    if (totalPercent !== 100) {
      setError(t('dietPlan.error.macroSum', { total: totalPercent }));
      return false;
    }
    setError(null);
    return true;
  };

  const handleGeneratePlan = async () => {
    if (!validateMacros()) return;

    setIsLoading(true);
    setError(null);
    setGeneratedPlan(null);
    setAiNotes(null);
    setLogMealStatus(null);

    try {
      const response = await geminiService.generateDietPlan({
        duration,
        targetCalories,
        proteinPercent,
        carbsPercent,
        fatPercent,
        cuisinePreference,
        dietaryRestrictions,
        currentLanguage: i18n.language,
        userProfile: currentUser, // Pass currentUser here
      });
      setGeneratedPlan(response.plan);
      setAiNotes(response.notes || null);
      if (response.plan.length === 0) {
        setError(t('dietPlan.error.noPlanGenerated'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dietPlan.error.apiError'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogPlannedMeal = async (mealDetail: PlannedMealDetail, dayIndex: number, mealType: string, itemIndex: number) => {
    setLoggingMealDetails({ mealName: mealDetail.name, dayIndex, mealType, itemIndex });
    setLogMealStatus(null);
    try {
      const nutritionInfo: NutritionalInfo | null = await geminiService.getNutritionalInfo(
        `${mealDetail.name}${mealDetail.description ? ` (${mealDetail.description})` : ''}`,
        i18n.language,
        null, null // No image for planned meals
      );

      if (nutritionInfo) {
        const foodToAdd: FoodItem = {
          id: `planlog-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
          name: nutritionInfo.name,
          calories: nutritionInfo.calories,
          protein: nutritionInfo.protein,
          carbs: nutritionInfo.carbs,
          fat: nutritionInfo.fat,
          quantity: `${nutritionInfo.serving_size_g || DEFAULT_NUTRITION_SERVING_SIZE_G}g (${t(DEFAULT_SERVING_QUANTITY)})`,
          timestamp: Date.now()
        };
        addFoodToLog(foodToAdd);
        setLogMealStatus({ type: 'success', message: t('dietPlan.logSuccess', { mealName: nutritionInfo.name }) });
      } else {
        setLogMealStatus({ type: 'error', message: t('dietPlan.logError', { mealName: mealDetail.name }) });
      }
    } catch (err) {
      console.error("Error logging planned meal:", err);
      setLogMealStatus({ type: 'error', message: t('dietPlan.logError', { mealName: mealDetail.name }) });
    } finally {
      setLoggingMealDetails(null);
      setTimeout(() => setLogMealStatus(null), 4000);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-white shadow-card rounded-xl">
      <div className="flex items-center space-x-2">
        {React.cloneElement(ICONS.documentText, {className: "w-7 h-7 text-primary"})}
        <h2 className="text-2xl font-semibold text-dark">{t('tabDietPlan')}</h2>
      </div>
      <p className="text-sm text-slate-600 -mt-2">{t('dietPlan.tagline')}</p>

      {/* Inputs Section */}
      <div className="space-y-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
        <h3 className="text-lg font-semibold text-dark">{t('dietPlan.preferencesTitle')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-slate-700">{t('dietPlan.duration.label')}</label>
            <select id="duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="mt-1 block w-full p-2.5 border-slate-300 rounded-lg shadow-sm focus:ring-primary-focus focus:border-primary-focus sm:text-sm bg-white">
              {DIET_PLAN_DURATION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="targetCalories" className="block text-sm font-medium text-slate-700">{t('dietPlan.targetCaloriesLabel')}</label>
            <input type="number" id="targetCalories" value={targetCalories} onChange={(e) => setTargetCalories(Number(e.target.value))} min="0" className="mt-1 block w-full p-2.5 border-slate-300 rounded-lg shadow-sm focus:ring-primary-focus focus:border-primary-focus sm:text-sm" />
          </div>
        </div>
        
        <div className="pt-3">
            <h4 className="text-md font-medium text-slate-700 mb-1">{t('dietPlan.macroDistributionLabel')} <span className="text-xs text-slate-500">({t('dietPlan.macroSumHelp', {total: proteinPercent + carbsPercent + fatPercent})})</span></h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                    <label htmlFor="proteinPercent" className="block text-xs text-slate-600">{t('protein')} (%)</label>
                    <input type="number" id="proteinPercent" value={proteinPercent} onChange={(e) => handleMacroChange(setProteinPercent, e.target.value)} min="0" max="100" className="mt-0.5 w-full p-2 border-slate-300 rounded-md shadow-sm sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="carbsPercent" className="block text-xs text-slate-600">{t('carbs')} (%)</label>
                    <input type="number" id="carbsPercent" value={carbsPercent} onChange={(e) => handleMacroChange(setCarbsPercent, e.target.value)} min="0" max="100" className="mt-0.5 w-full p-2 border-slate-300 rounded-md shadow-sm sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="fatPercent" className="block text-xs text-slate-600">{t('fat')} (%)</label>
                    <input type="number" id="fatPercent" value={fatPercent} onChange={(e) => handleMacroChange(setFatPercent, e.target.value)} min="0" max="100" className="mt-0.5 w-full p-2 border-slate-300 rounded-md shadow-sm sm:text-sm" />
                </div>
            </div>
        </div>

        <div>
          <label htmlFor="cuisinePreferencePlan" className="block text-sm font-medium text-slate-700">{t('dietPlan.cuisinePreferenceLabel')}</label>
          <input type="text" id="cuisinePreferencePlan" value={cuisinePreference} onChange={(e) => setCuisinePreference(e.target.value)} placeholder={t('dietPlan.cuisinePreferencePlaceholder')} className="mt-1 block w-full p-2.5 border-slate-300 rounded-lg shadow-sm focus:ring-primary-focus focus:border-primary-focus sm:text-sm" />
        </div>
        <div>
          <label htmlFor="dietaryRestrictionsPlan" className="block text-sm font-medium text-slate-700">{t('dietPlan.dietaryRestrictionsLabel')}</label>
          <textarea id="dietaryRestrictionsPlan" rows={2} value={dietaryRestrictions} onChange={(e) => setDietaryRestrictions(e.target.value)} placeholder={t('dietPlan.dietaryRestrictionsPlaceholder')} className="mt-1 block w-full p-2.5 border-slate-300 rounded-lg shadow-sm focus:ring-primary-focus focus:border-primary-focus sm:text-sm" />
        </div>
      </div>

      <button onClick={handleGeneratePlan} disabled={isLoading} className="w-full px-6 py-3.5 bg-primary text-white text-lg font-semibold rounded-lg shadow-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-2 transition-colors disabled:opacity-60 flex items-center justify-center space-x-2">
        {isLoading ? <LoadingSpinner size="h-6 w-6" /> : React.cloneElement(ICONS.aiSparkle, {className: "w-6 h-6"})}
        <span>{isLoading ? t('dietPlan.generatingPlan') : t('dietPlan.generateButton')}</span>
      </button>

      {logMealStatus && (
        <div className={`p-3 rounded-md text-sm mt-3 ${logMealStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} role={logMealStatus.type === 'error' ? 'alert' : 'status'}>
            {logMealStatus.message}
        </div>
      )}

      {error && <p className="text-red-700 bg-red-100 p-3 rounded-lg text-sm flex items-center space-x-2">{React.cloneElement(ICONS.info, {className: "w-5 h-5 flex-shrink-0"})}<span>{error}</span></p>}

      {/* Display Plan Section */}
      {generatedPlan && !isLoading && (
        <div className="mt-6 space-y-6">
          <h3 className="text-xl font-semibold text-dark">{t('dietPlan.generatedPlanTitle')}</h3>
          {aiNotes && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              <p className="font-medium mb-1">{t('dietPlan.aiNotesTitle')}</p>
              <p className="whitespace-pre-line">{aiNotes}</p>
            </div>
          )}
          <div className="space-y-4">
            {generatedPlan.map((day, dayIndex) => (
              <div key={day.dayLabel} className="p-4 border border-green-200 rounded-lg bg-green-50 shadow-sm">
                <h4 className="text-lg font-semibold text-green-800 mb-3">{day.dayLabel} - {t('dietPlan.dailyTarget')}: {day.dailyTotals.calories.toFixed(0)} kcal (P:{day.dailyTotals.protein.toFixed(0)}g, C:{day.dailyTotals.carbs.toFixed(0)}g, F:{day.dailyTotals.fat.toFixed(0)}g)</h4>
                {(Object.keys(day.meals) as Array<keyof DietPlanDay['meals']>).map(mealTypeKey => (
                  day.meals[mealTypeKey].length > 0 && (
                    <div key={mealTypeKey} className="mb-3 pl-2">
                      <h5 className="text-md font-medium text-slate-700 capitalize mb-1.5">{t(`mealTypes.${mealTypeKey}`)}</h5>
                      <ul className="space-y-1.5">
                        {day.meals[mealTypeKey].map((meal, itemIndex) => (
                          <li key={`${meal.name}-${itemIndex}`} className="text-sm p-2 bg-white rounded-md border border-slate-200 shadow-xs">
                            <p className="font-semibold text-slate-800">{meal.name}</p>
                            {meal.description && <p className="text-xs text-slate-500 italic mt-0.5">{meal.description}</p>}
                            <p className="text-xs text-slate-600 mt-0.5">~{meal.estimatedCalories.toFixed(0)} kcal (P:{meal.estimatedProtein.toFixed(0)}g, C:{meal.estimatedCarbs.toFixed(0)}g, F:{meal.estimatedFat.toFixed(0)}g)</p>
                            <button
                              onClick={() => handleLogPlannedMeal(meal, dayIndex, mealTypeKey, itemIndex)}
                              disabled={loggingMealDetails?.dayIndex === dayIndex && loggingMealDetails?.mealType === mealTypeKey && loggingMealDetails?.itemIndex === itemIndex}
                              className="mt-1.5 px-2.5 py-1 bg-primary text-white text-xs font-medium rounded shadow-sm hover:bg-primary-hover disabled:opacity-70 flex items-center space-x-1"
                            >
                              {(loggingMealDetails?.dayIndex === dayIndex && loggingMealDetails?.mealType === mealTypeKey && loggingMealDetails?.itemIndex === itemIndex) ? <LoadingSpinner size="h-3 w-3" /> : React.cloneElement(ICONS.plus, {className: "w-3 h-3"})}
                              <span>{t('dietPlan.logThisMeal')}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DietPlanTab;