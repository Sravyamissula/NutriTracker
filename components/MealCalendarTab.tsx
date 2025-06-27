
import React, { useState, useMemo } from 'react';
import { useDailyLog } from '../contexts/DailyLogContext';
import { PlannedMealItem, MealTypeId } from '../types';
import { ICONS, MEAL_TYPES } from '../constants';
import MealPlannerModal from './meal_planner/MealPlannerModal';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from './common/LoadingSpinner';

const MealCalendarTab: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { 
    plannedMeals, 
    removePlannedMeal, 
    getPlannedMealsForDateAndType, 
    isPlannedMealsLoading 
  } = useDailyLog();

  const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // 0 for current week, -1 for last week, 1 for next week
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTargetDate, setModalTargetDate] = useState('');
  const [modalMealType, setModalMealType] = useState<MealTypeId>('breakfast');

  const openPlannerModal = (date: string, mealType: MealTypeId) => {
    setModalTargetDate(date);
    setModalMealType(mealType);
    setIsModalOpen(true);
  };

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // Sunday - 0, Monday - 1, ... , Saturday - 6
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - currentDayOfWeek + (currentWeekOffset * 7)); // Start from Sunday of the target week

    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentWeekOffset]);

  const formatDateToYYYYMMDD = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const calculateDailyTotals = (date: string) => {
    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    MEAL_TYPES.forEach(mealType => {
      getPlannedMealsForDateAndType(date, mealType.id).forEach(item => {
        totals.calories += item.calories;
        totals.protein += item.protein;
        totals.carbs += item.carbs;
        totals.fat += item.fat;
      });
    });
    return totals;
  };


  if (isPlannedMealsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size="h-12 w-12" />
        <p className="ml-3 text-lg text-slate-600">{t('mealPlanner.loadingPlans')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1 md:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-card">
        <h2 className="text-2xl font-semibold text-dark flex items-center space-x-2">
           {React.cloneElement(ICONS.calendarDays, {className: "w-7 h-7 text-primary"})}
           <span>{t('tabPlanner')}</span>
        </h2>
        <div className="flex items-center space-x-2 sm:space-x-3 mt-3 sm:mt-0">
          <button
            onClick={() => setCurrentWeekOffset(prev => prev - 1)}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium"
            aria-label={t('mealPlanner.previousWeek')}
          >
            &lt; {t('mealPlanner.previousWeekShort')}
          </button>
          <span className="text-md font-medium text-slate-700 w-32 text-center">
            {new Date(weekDays[0].getFullYear(), weekDays[0].getMonth(), weekDays[0].getDate()).toLocaleDateString(i18n.language, { month: 'short', year: 'numeric' })}
          </span>
          <button
            onClick={() => setCurrentWeekOffset(prev => prev + 1)}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium"
            aria-label={t('mealPlanner.nextWeek')}
          >
            {t('mealPlanner.nextWeekShort')} &gt;
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {weekDays.map(day => {
          const yyyymmdd = formatDateToYYYYMMDD(day);
          const dailyTotals = calculateDailyTotals(yyyymmdd);
          const isToday = formatDateToYYYYMMDD(new Date()) === yyyymmdd;

          return (
            <div key={yyyymmdd} className={`bg-white rounded-xl shadow-card p-4 space-y-3 flex flex-col ${isToday ? 'border-2 border-primary' : 'border border-transparent'}`}>
              <div className="text-center pb-2 border-b border-slate-200">
                <p className={`font-semibold ${isToday ? 'text-primary' : 'text-dark'}`}>{day.toLocaleDateString(i18n.language, { weekday: 'long' })}</p>
                <p className={`text-sm ${isToday ? 'text-primary-focus' : 'text-slate-500'}`}>{day.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })}</p>
              </div>

              <div className="flex-grow space-y-3 overflow-y-auto max-h-96 pr-1">
                {MEAL_TYPES.map(mealType => {
                  const mealsInSlot = getPlannedMealsForDateAndType(yyyymmdd, mealType.id);
                  return (
                    <div key={mealType.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <h4 className="text-sm font-medium text-slate-700 mb-1.5">{t(mealType.labelKey)}</h4>
                      {mealsInSlot.length > 0 ? (
                        <ul className="space-y-1.5 text-xs">
                          {mealsInSlot.map(item => (
                            <li key={item.id} className="group flex justify-between items-start bg-white p-1.5 rounded shadow-sm">
                              <div>
                                <p className="font-medium text-slate-800">{item.name}</p>
                                <p className="text-slate-500">
                                  {item.calories.toFixed(0)}kcal &bull; P:{item.protein.toFixed(0)}g C:{item.carbs.toFixed(0)}g F:{item.fat.toFixed(0)}g
                                </p>
                              </div>
                              <button 
                                onClick={() => removePlannedMeal(item.id)} 
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-0.5 rounded transition-opacity"
                                title={t('removeItem')}
                                aria-label={`${t('removeItem')} ${item.name}`}
                              >
                                {React.cloneElement(ICONS.trash, {className:"w-3.5 h-3.5"})}
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400 italic text-center py-1">{t('mealPlanner.emptySlot')}</p>
                      )}
                       <button
                        onClick={() => openPlannerModal(yyyymmdd, mealType.id)}
                        className="mt-2 w-full text-xs text-primary hover:text-primary-hover font-medium py-1 px-2 rounded-md border border-primary border-dashed hover:bg-green-50 transition-colors flex items-center justify-center space-x-1"
                        aria-label={`${t('mealPlanner.addMealTo')} ${t(mealType.labelKey)}`}
                      >
                        {React.cloneElement(ICONS.plus, {className:"w-3 h-3"})}
                        <span>{t('mealPlanner.addMeal')}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-slate-200 pt-2 mt-auto">
                <p className="text-xs font-semibold text-slate-600 text-right">{t('mealPlanner.dailyTotal')}:</p>
                <p className="text-sm font-bold text-primary text-right">{dailyTotals.calories.toFixed(0)} kcal</p>
                <p className="text-xs text-slate-500 text-right">
                    P:{dailyTotals.protein.toFixed(0)}g &bull; C:{dailyTotals.carbs.toFixed(0)}g &bull; F:{dailyTotals.fat.toFixed(0)}g
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <MealPlannerModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          targetDate={modalTargetDate}
          mealType={modalMealType}
        />
      )}
    </div>
  );
};

export default MealCalendarTab;
