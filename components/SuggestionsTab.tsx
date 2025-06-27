
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { useDailyLog } from '../contexts/DailyLogContext';
import { ICONS, FITNESS_MODES, MEAL_TYPE_SUGGESTION_OPTIONS, DEFAULT_NUTRITION_SERVING_SIZE_G, DEFAULT_SERVING_QUANTITY } from '../constants';
import LoadingSpinner from './common/LoadingSpinner';
import { GroundingChunk, AISuggestedMeal, NutritionalInfo, FoodItem } from '../types';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

const SuggestionsTab: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth(); // Get currentUser
  const [context, setContext] = useState<string>('');
  const [cuisinePreference, setCuisinePreference] = useState<string>('');
  const [selectedMealType, setSelectedMealType] = useState<string>(MEAL_TYPE_SUGGESTION_OPTIONS[0].value);
  
  const [suggestions, setSuggestions] = useState<AISuggestedMeal[]>([]);
  const [sources, setSources] = useState<GroundingChunk[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    getTodaysIntake, dailyLog, effectiveCalorieGoal, currentFitnessMode, addFoodToLog 
  } = useDailyLog();

  // For "Log this Meal" feedback
  const [loggingSuggestedMealId, setLoggingSuggestedMealId] = useState<string | null>(null); // Use meal name as temporary ID
  const [logSuggestionStatus, setLogSuggestionStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);


  useEffect(() => {
    const intake = getTodaysIntake();
    const recentFoods = dailyLog
      .filter(entry => entry.timestamp && new Date(entry.timestamp!).toDateString() === new Date().toDateString())
      .slice(-3)
      .map(item => item.name)
      .join(', ');

    const currentFitnessModeDetails = FITNESS_MODES.find(fm => fm.id === currentFitnessMode);
    const fitnessModeLabel = currentFitnessModeDetails ? t(currentFitnessModeDetails.labelKey) : '';

    let initialContext = t('suggestions.initialContextBase');
    if (intake.calories > 0) {
      initialContext += ` ${t('suggestions.initialContextIntake', { 
        calories: intake.calories.toFixed(0), 
        goal: effectiveCalorieGoal.toFixed(0),
        protein: intake.protein.toFixed(0),
        carbs: intake.carbs.toFixed(0),
        fat: intake.fat.toFixed(0)
       })}`;
    }
    if (recentFoods) {
      initialContext += ` ${t('suggestions.initialContextRecentFoods', { foods: recentFoods })}`;
    }
    if(fitnessModeLabel) {
        initialContext += ` ${t('suggestions.initialContextFitnessMode', {mode: fitnessModeLabel})}`;
    }
    initialContext += ` ${t('suggestions.initialContextPreferencePlaceholder')}`; // This placeholder part is more for user guidance
    setContext(initialContext);
  }, [dailyLog, getTodaysIntake, effectiveCalorieGoal, currentFitnessMode, t, i18n.language]);

  const handleGetSuggestions = async () => {
    if (!context.trim()) {
      setError(t('errorNoContext'));
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    setSources(undefined);
    setLogSuggestionStatus(null);
    try {
      const result = await geminiService.suggestMeals(
        context, 
        i18n.language, 
        effectiveCalorieGoal,
        currentFitnessMode,
        cuisinePreference,
        selectedMealType,
        currentUser // Pass currentUser here
      );
      setSuggestions(result.suggestions || []);
      setSources(result.sources);
      if ((!result.suggestions || result.suggestions.length === 0) && !result.sources?.length) {
        setError(t('errorAISuggestionsGeneric'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorAIFailedSuggestions'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogSuggestedMeal = async (suggestedMeal: AISuggestedMeal) => {
    setLoggingSuggestedMealId(suggestedMeal.name);
    setLogSuggestionStatus(null);
    try {
        const nutritionInfo: NutritionalInfo | null = await geminiService.getNutritionalInfo(
            `${suggestedMeal.name} - ${suggestedMeal.description}`, // Provide more context to Gemini
            i18n.language,
            null, // No image for suggested meals
            null
        );

        if (nutritionInfo) {
            const foodToAdd: FoodItem = {
                id: `sugg-${Date.now().toString()}-${Math.random().toString(36).substring(2,7)}`,
                name: nutritionInfo.name, // Use the (potentially translated) name from nutrition service
                calories: nutritionInfo.calories,
                protein: nutritionInfo.protein,
                carbs: nutritionInfo.carbs,
                fat: nutritionInfo.fat,
                quantity: `${nutritionInfo.serving_size_g || DEFAULT_NUTRITION_SERVING_SIZE_G}g (${t(DEFAULT_SERVING_QUANTITY)})`,
                timestamp: Date.now()
            };
            addFoodToLog(foodToAdd);
            setLogSuggestionStatus({ type: 'success', message: t('suggestions.mealLoggedSuccess', { mealName: nutritionInfo.name }) });
        } else {
            setLogSuggestionStatus({ type: 'error', message: t('suggestions.mealLoggedError', { mealName: suggestedMeal.name }) });
        }
    } catch (error) {
        console.error("Error logging suggested meal:", error);
        setLogSuggestionStatus({ type: 'error', message: t('suggestions.mealLoggedError', { mealName: suggestedMeal.name }) });
    } finally {
        setLoggingSuggestedMealId(null);
         setTimeout(() => setLogSuggestionStatus(null), 4000); // Clear status after a few seconds
    }
  };


  return (
    <div className="space-y-6 p-4 md:p-6 bg-white shadow-card rounded-xl">
      <div className="flex items-center space-x-2">
        {React.cloneElement(ICONS.aiSparkle, {className: "w-7 h-7 text-primary"})}
        <h2 className="text-2xl font-semibold text-dark">{t('aiPoweredMealSuggestions')}</h2>
      </div>
      <p className="text-sm text-slate-600 -mt-2">
        {t('suggestionsTagline')}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cuisinePreference" className="block text-sm font-medium text-slate-700 mb-1">
            {t('suggestions.cuisinePreferenceLabel')}
          </label>
          <input
            type="text"
            id="cuisinePreference"
            value={cuisinePreference}
            onChange={(e) => setCuisinePreference(e.target.value)}
            placeholder={t('suggestions.cuisinePreferencePlaceholder')}
            className="w-full p-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-focus focus:border-primary-focus sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="mealType" className="block text-sm font-medium text-slate-700 mb-1">
            {t('suggestions.mealTypeLabel')}
          </label>
          <select
            id="mealType"
            value={selectedMealType}
            onChange={(e) => setSelectedMealType(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-focus focus:border-primary-focus sm:text-sm bg-white"
          >
            {MEAL_TYPE_SUGGESTION_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div>
        <label htmlFor="dietContext" className="block text-md font-medium text-slate-700 mb-1.5">
          {t('yourDietaryContext')}
        </label>
        <textarea
          id="dietContext"
          rows={4}
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder={t('suggestions.contextPlaceholder')}
          className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-focus focus:border-primary-focus sm:text-sm"
          aria-describedby="contextHelp"
        />
        <p id="contextHelp" className="text-xs text-slate-500 mt-1">{t('contextHelp')}</p>
      </div>

      <button
        onClick={handleGetSuggestions}
        disabled={isLoading || !context.trim()}
        className="w-full px-6 py-3.5 bg-primary text-white text-lg font-semibold rounded-lg shadow-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-2 transition-colors disabled:opacity-60 flex items-center justify-center space-x-2"
      >
        {isLoading && loggingSuggestedMealId === null ? <LoadingSpinner size="h-6 w-6" /> : React.cloneElement(ICONS.lightbulb, {className: "w-6 h-6"})}
        <span>{isLoading && loggingSuggestedMealId === null ? t("aiCraftingIdeas") : t("getSuggestions")}</span>
      </button>

      {logSuggestionStatus && (
        <div className={`p-3 rounded-md text-sm mt-3 ${logSuggestionStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} role={logSuggestionStatus.type === 'error' ? 'alert' : 'status'}>
            {logSuggestionStatus.message}
        </div>
      )}

      {isLoading && loggingSuggestedMealId === null && (
         <div className="flex flex-col items-center justify-center my-4 p-4 bg-sky-50 rounded-lg">
          <LoadingSpinner />
          <p className="mt-2 text-secondary font-medium">{t('aiThinking')}</p>
        </div>
      )}

      {error && <p className="text-red-700 bg-red-100 p-3 rounded-lg text-sm flex items-center space-x-2">{React.cloneElement(ICONS.info, { className: "w-5 h-5 flex-shrink-0" })}<span>{error}</span></p>}

      {suggestions.length > 0 && !isLoading && (
        <div className="mt-6 space-y-4">
          <h3 className="text-xl font-semibold text-dark">{t('aiGeneratedIdeas')}</h3>
          <ul className="space-y-3">
            {suggestions.map((meal, index) => (
              <li key={index} className="p-4 bg-green-50 rounded-lg border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-green-800 text-md">{meal.name}</h4>
                <p className="text-sm text-slate-600 my-1 leading-relaxed">{meal.description}</p>
                <p className="text-xs text-slate-500">
                  {t('calories')}: ~{meal.estimatedCalories.toFixed(0)} | {t('proteinAbbr')}: ~{meal.estimatedProtein.toFixed(0)}g | {t('carbsAbbr')}: ~{meal.estimatedCarbs.toFixed(0)}g | {t('fatAbbr')}: ~{meal.estimatedFat.toFixed(0)}g
                </p>
                <button
                  onClick={() => handleLogSuggestedMeal(meal)}
                  disabled={loggingSuggestedMealId === meal.name}
                  className="mt-2.5 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-md shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-1 focus:ring-primary-focus focus:ring-offset-1 transition-colors disabled:opacity-70 flex items-center space-x-1.5"
                >
                  {loggingSuggestedMealId === meal.name ? <LoadingSpinner size="h-4 w-4" /> : React.cloneElement(ICONS.plus, {className: "w-4 h-4"})}
                  <span>{loggingSuggestedMealId === meal.name ? t('suggestions.loggingMeal') : t('suggestions.logThisMeal')}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {sources && sources.length > 0 && !isLoading && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <h4 className="text-md font-semibold text-dark mb-2">{t('sourcesFromGoogle')}</h4>
          <ul className="space-y-1.5 list-disc list-inside pl-1">
            {sources.map((source, index) => source.web && (
              <li key={index} className="text-sm text-slate-600">
                <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-secondary-hover hover:underline underline-offset-2 decoration-dotted">
                  {source.web.title || source.web.uri}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {suggestions.length === 0 && (!sources || sources.length === 0) && !isLoading && !error && context.trim() && (
          <div className="text-center py-8 px-4 text-slate-500">
            {React.cloneElement(ICONS.info, {className:"w-12 h-12 mx-auto mb-3 text-slate-400"})}
            <p className="font-medium">{t('noSuggestionsGenerated')}</p>
            <p className="text-sm">{t('tryDifferentContext')}</p>
          </div>
        )}
    </div>
  );
};

export default SuggestionsTab;