
import React, { useState } from 'react';
import { useDailyLog } from '../../contexts/DailyLogContext';
import { geminiService } from '../../services/geminiService';
import { MealTypeId, PlannedMealItem, NutritionalInfo } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import { ICONS, DEFAULT_SERVING_QUANTITY, DEFAULT_NUTRITION_SERVING_SIZE_G } from '../../constants';
import { useTranslation } from 'react-i18next';

interface MealPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate: string; // YYYY-MM-DD
  mealType: MealTypeId;
}

const MealPlannerModal: React.FC<MealPlannerModalProps> = ({ isOpen, onClose, targetDate, mealType }) => {
  const { t, i18n } = useTranslation();
  const [mealDescription, setMealDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addPlannedMeal } = useDailyLog();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealDescription.trim()) {
      setError(t('mealPlanner.errorEmptyDescription'));
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // No image for hand reference in meal planner, so pass null for image params
      const nutritionInfo = await geminiService.getNutritionalInfo(mealDescription, i18n.language, null, null);
      if (nutritionInfo) {
        const plannedItem: Omit<PlannedMealItem, 'id' | 'timestamp'> = {
          name: nutritionInfo.name, // Name should be translated by Gemini
          calories: nutritionInfo.calories,
          protein: nutritionInfo.protein,
          carbs: nutritionInfo.carbs,
          fat: nutritionInfo.fat,
          quantity: `${nutritionInfo.serving_size_g || DEFAULT_NUTRITION_SERVING_SIZE_G}g (${t(DEFAULT_SERVING_QUANTITY)})`,
          plannedDate: targetDate,
          mealType: mealType,
        };
        addPlannedMeal(plannedItem);
        setMealDescription(''); // Clear input on success
        onClose();
      } else {
        setError(t('mealPlanner.errorCouldNotFetchNutrition', { mealDescription }));
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : t('mealPlanner.errorAIService'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out" onClick={onClose}>
      <div 
        className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mealPlannerModalTitle"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="mealPlannerModalTitle" className="text-xl sm:text-2xl font-bold text-dark flex items-center space-x-2">
            {React.cloneElement(ICONS.plus, {className: "w-6 h-6 text-primary"})}
            <span>{t('mealPlanner.addMealTo', { mealType: t(`mealTypes.${mealType}`), date: new Date(targetDate + 'T00:00:00').toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' }) })}</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors" aria-label={t('closeModal') || 'Close modal'}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && <p className="text-red-600 bg-red-100 p-3 rounded-md text-sm mb-4" role="alert">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="mealDescription" className="block text-sm font-medium text-slate-700 mb-1">{t('mealPlanner.mealDescriptionLabel')}</label>
            <textarea
              id="mealDescription"
              rows={3}
              value={mealDescription}
              onChange={(e) => setMealDescription(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-focus focus:border-primary-focus"
              placeholder={t('mealPlanner.descriptionPlaceholder')}
            />
            <p className="text-xs text-slate-500 mt-1">{t('mealPlanner.descriptionHelp')}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-1 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-2 transition-colors disabled:opacity-70 flex items-center justify-center"
            >
              {isLoading ? <LoadingSpinner size="h-5 w-5" /> : (
                <>
                  {React.cloneElement(ICONS.aiSparkle, {className: "w-5 h-5 mr-2"})}
                  {t('mealPlanner.addAndFetchNutrition')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      {/* Re-using modal animation style if already defined in Login/Signup Modals. Otherwise, define it here. */}
      <style>{`
        @keyframes modalShow {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-modalShow { animation: modalShow 0.3s forwards cubic-bezier(0.165, 0.84, 0.44, 1); }
      `}</style>
    </div>
  );
};

export default MealPlannerModal;
