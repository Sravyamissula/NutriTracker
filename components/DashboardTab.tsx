
import React, { useState, useEffect, useMemo } from 'react';
import { useDailyLog } from '../contexts/DailyLogContext';
import { DailyLogEntry, FitnessModeId, Milestone, MilestoneDefinition, WaterIntakeRecord, SleepRecord, Challenge } from '../types';
import { ICONS, FITNESS_MODES, MILESTONE_DEFINITIONS, DEFAULT_WATER_GOAL_ML, DEFAULT_SLEEP_GOAL_HOURS, CHALLENGE_DEFINITIONS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import LoadingSpinner from './common/LoadingSpinner';
import { useTranslation } from 'react-i18next';
import { calculateLinearRegression } from '../src/utils/regression';
import MacronutrientPieChart from './common/MacronutrientPieChart'; 
import { geminiService } from '../services/geminiService'; 
import { useAuth } from '../contexts/AuthContext';

type CustomCellDef = {
  content: string; 
  colSpan?: number;
  rowSpan?: number;
  styles?: {
    fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
    halign?: 'left' | 'center' | 'right' | 'justify';
    fillColor?: string | [number, number, number];
    textColor?: string | [number, number, number];
  };
};
type TableCell = string | number | CustomCellDef;

interface ForecastValue {
  value: number;
  status: 'onTrack' | 'slightlyOver' | 'significantlyOver' | 'slightlyUnder' | 'significantlyUnder' | 'moreDataNeeded' | 'trendStagnant' | 'trendNotReliable';
  message: string;
}

interface NutrientForecasts {
  calories: ForecastValue;
  protein: ForecastValue;
  carbs: ForecastValue;
  fat: ForecastValue;
}
interface GoalForecasts {
  weekly: NutrientForecasts | null;
  monthly: NutrientForecasts | null;
}


const DashboardTab: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();
  const { 
    userGoal, setBaseCalorieGoal, getTodaysIntake, getWeeklyIntakeData, dailyLog, 
    removeFoodFromLog, getDetailedWeeklyLog, currentFitnessMode, setFitnessMode,
    effectiveCalorieGoal, getHistoricalIntakeSeries,
    getDistinctFoodNamesOverDays,
    waterIntakeRecords, addWaterIntake, getWaterIntakeForDate, removeWaterIntake,
    sleepRecords, addSleepRecord, getSleepRecordForDate, removeSleepRecord,
    shareMeal,
  } = useDailyLog();

  const [newBaseGoal, setNewBaseGoal] = useState<number>(userGoal.baseCalories);
  const [todaysIntake, setTodaysIntake] = useState(getTodaysIntake());
  const [weeklyData, setWeeklyData] = useState(getWeeklyIntakeData());
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  
  const [forecasts, setForecasts] = useState<GoalForecasts | null>(null);
  const [isCalculatingForecasts, setIsCalculatingForecasts] = useState(false);

  const [micronutrientAnalysis, setMicronutrientAnalysis] = useState<string | null>(null);
  const [isAnalyzingMicronutrients, setIsAnalyzingMicronutrients] = useState(false);
  const [micronutrientError, setMicronutrientError] = useState<string | null>(null);

  const [waterInput, setWaterInput] = useState('');
  const [sleepInput, setSleepInput] = useState('');

  const HISTORICAL_DAYS_FOR_FORECAST = 30;
  const MIN_DAYS_FOR_WEEKLY_REGRESSION = 5;
  const DAYS_FOR_WEEKLY_REGRESSION_INPUT = 14;
  const MIN_DAYS_FOR_MONTHLY_REGRESSION = 7;
  const DAYS_FOR_MICRONUTRIENT_ANALYSIS = 7;
  
  useEffect(() => {
    setTodaysIntake(getTodaysIntake());
    setWeeklyData(getWeeklyIntakeData()); 
    setNewBaseGoal(userGoal.baseCalories); 
  }, [dailyLog, userGoal, getTodaysIntake, getWeeklyIntakeData, i18n.language]);

  const nutrientGoals = useMemo(() => ({
    calories: effectiveCalorieGoal,
    protein: (effectiveCalorieGoal * 0.30) / 4, 
    carbs: (effectiveCalorieGoal * 0.40) / 4,   
    fat: (effectiveCalorieGoal * 0.30) / 9     
  }), [effectiveCalorieGoal]);

  useEffect(() => {
    const calculateForecasts = () => {
        setIsCalculatingForecasts(true);
        const historicalData = getHistoricalIntakeSeries(HISTORICAL_DAYS_FOR_FORECAST);
        const newForecasts: GoalForecasts = { weekly: null, monthly: null };

        const getForecastStatusAndMessage = (projected: number, goal: number, nutrientKey: keyof NutrientForecasts, period: 'weekly' | 'monthly'): ForecastValue => {
            if (goal <= 0 || isNaN(goal) || !isFinite(goal)) return { value: projected, status: 'trendNotReliable', message: t('forecast.status.goalNotSet') };
            const diffPercent = ((projected - goal) / goal) * 100;
            let status: ForecastValue['status'] = 'onTrack';
            let messageKey = 'forecast.status.onTrack';
            if (diffPercent > 15) { status = 'significantlyOver'; messageKey = 'forecast.status.significantlyOver'; }
            else if (diffPercent > 5) { status = 'slightlyOver'; messageKey = 'forecast.status.slightlyOver'; }
            else if (diffPercent < -15) { status = 'significantlyUnder'; messageKey = 'forecast.status.significantlyUnder'; }
            else if (diffPercent < -5) { status = 'slightlyUnder'; messageKey = 'forecast.status.slightlyUnder'; }
            
            const message = t(messageKey, { percentage: Math.abs(diffPercent).toFixed(0) });
            const nutrientLabel = t(`forecast.nutrientLabel.${nutrientKey}`);
            const periodLabel = t(period === 'weekly' ? 'forecast.weeklyTitleShort' : 'forecast.monthlyTitleShort');
            const fullMessage = `${periodLabel} ${nutrientLabel}: ${projected.toFixed(nutrientKey === 'calories' ? 0 : 1)} / ${goal.toFixed(nutrientKey === 'calories' ? 0 : 1)}. ${message}`;
            return { value: projected, status, message: fullMessage };
        };

        const nutrientKeys: Array<keyof NutrientForecasts> = ['calories', 'protein', 'carbs', 'fat'];
        newForecasts.weekly = nutrientKeys.reduce((acc, key) => {
            const series = historicalData[key].slice(-DAYS_FOR_WEEKLY_REGRESSION_INPUT);
            if (series.filter(dp => dp.y > 0).length < MIN_DAYS_FOR_WEEKLY_REGRESSION) {
                acc[key] = { value: 0, status: 'moreDataNeeded', message: t('forecast.moreDataNeeded', { days: MIN_DAYS_FOR_WEEKLY_REGRESSION })};
            } else {
                const regression = calculateLinearRegression(series);
                if (regression) {
                    let projectedTotal = 0; for (let i = 0; i < 7; i++) projectedTotal += regression.predict(series.length + i);
                    acc[key] = getForecastStatusAndMessage(Math.max(0, projectedTotal), nutrientGoals[key] * 7, key, 'weekly');
                } else acc[key] = { value: 0, status: 'trendNotReliable', message: t('forecast.status.trendNotReliable') };
            }
            return acc;
        }, {} as NutrientForecasts);

        newForecasts.monthly = nutrientKeys.reduce((acc, key) => {
            const series = historicalData[key];
            if (series.filter(dp => dp.y > 0).length < MIN_DAYS_FOR_MONTHLY_REGRESSION) {
                acc[key] = { value: 0, status: 'moreDataNeeded', message: t('forecast.moreDataNeeded', { days: MIN_DAYS_FOR_MONTHLY_REGRESSION })};
            } else {
                const regression = calculateLinearRegression(series);
                if (regression) {
                    let projectedDaily = regression.predict(HISTORICAL_DAYS_FOR_FORECAST - 1); 
                    acc[key] = getForecastStatusAndMessage(Math.max(0, projectedDaily), nutrientGoals[key], key, 'monthly');
                } else acc[key] = { value: 0, status: 'trendNotReliable', message: t('forecast.status.trendNotReliable') };
            }
            return acc;
        }, {} as NutrientForecasts);

        setForecasts(newForecasts);
        setIsCalculatingForecasts(false);
    };
    if (dailyLog.length > 0 && effectiveCalorieGoal > 0) calculateForecasts();
    else { setForecasts(null); setIsCalculatingForecasts(false); }
  }, [dailyLog, effectiveCalorieGoal, getHistoricalIntakeSeries, i18n.language, t, nutrientGoals]);

  const handleBaseGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setNewBaseGoal(isNaN(val) || val < 0 ? (e.target.value === '' ? 0 : newBaseGoal) : val);
  };

  const handleSetBaseGoal = (e: React.FormEvent) => {
    e.preventDefault();
    setBaseCalorieGoal(newBaseGoal > 0 ? newBaseGoal : (userGoal.baseCalories > 0 ? userGoal.baseCalories : 2000));
    if (newBaseGoal <= 0) setNewBaseGoal(userGoal.baseCalories > 0 ? userGoal.baseCalories : 2000);
  };
  
  const handleFitnessModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => setFitnessMode(e.target.value as FitnessModeId);

  const handleExportWeeklyPDF = async () => { 
    setIsExportingPdf(true);
    await new Promise(resolve => setTimeout(resolve, 50)); 
    const doc = new jsPDF();
    const detailedLog = getDetailedWeeklyLog();
    let yPos = 20;

    doc.setFontSize(18);
    doc.text(t('Report for') + ` ${new Date().toLocaleDateString(i18n.language)}`, 14, yPos);
    yPos += 10;

    const summaryData: { day: string; calories: number; protein: number; carbs: number; fat: number }[] = [];

    Object.entries(detailedLog).forEach(([dateStr, entries]) => {
        if (yPos > doc.internal.pageSize.getHeight() - 40) { 
            doc.addPage();
            yPos = 20;
        }
        doc.setFontSize(14);
        doc.text(dateStr, 14, yPos);
        yPos += 8;

        let dailyCalories = 0, dailyProtein = 0, dailyCarbs = 0, dailyFat = 0;
        
        const bodyData: TableCell[][] = entries.map(item => {
            dailyCalories += item.calories;
            dailyProtein += item.protein;
            dailyCarbs += item.carbs;
            dailyFat += item.fat;
            return [item.name, item.quantity, item.calories.toFixed(0), item.protein.toFixed(1), item.carbs.toFixed(1), item.fat.toFixed(1)];
        });

        if (entries.length > 0) {
            autoTable(doc, {
                startY: yPos,
                head: [[t('Food Item'), t('Qty'), t('calories'), t('protein')+' (g)', t('carbs')+' (g)', t('fat')+' (g)']],
                body: bodyData,
                theme: 'grid',
                headStyles: { fillColor: [34, 197, 94] },
                didDrawPage: (data) => { yPos = data.cursor?.y || yPos; }
            });
            yPos = (doc as any).lastAutoTable.finalY + 10;
        } else {
            doc.setFontSize(10);
            doc.text(t('noFoodLoggedToday'), 14, yPos);
            yPos += 7;
        }
        summaryData.push({ day: dateStr, calories: dailyCalories, protein: dailyProtein, carbs: dailyCarbs, fat: dailyFat });
    });
    
    if (yPos > doc.internal.pageSize.getHeight() - 60 || Object.entries(detailedLog).length > 2) { 
        doc.addPage();
        yPos = 20;
    } else {
        yPos += 5; 
    }

    doc.setFontSize(16);
    doc.text(t('Weekly Summary'), 14, yPos);
    yPos += 10;
    
    autoTable(doc, {
        startY: yPos,
        head: [['Day', t('Total Calories'), t('Total Protein')+' (g)', t('Total Carbs')+' (g)', t('Total Fat')+' (g)']],
        body: summaryData.map(s => [s.day, s.calories.toFixed(0), s.protein.toFixed(1), s.carbs.toFixed(1), s.fat.toFixed(1)]),
        theme: 'striped',
        headStyles: { fillColor: [14, 165, 233] }, 
    });
    
    doc.setFontSize(8);
    doc.text(`${t('Report generated on')} ${new Date().toLocaleString(i18n.language)}`, 14, doc.internal.pageSize.getHeight() - 10);
    
    doc.save(`NutriTrack_Weekly_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    setIsExportingPdf(false);
  };

  const handleAnalyzeMicronutrients = async () => {
    setIsAnalyzingMicronutrients(true);
    setMicronutrientError(null);
    setMicronutrientAnalysis(null);
    const foodNames = getDistinctFoodNamesOverDays(DAYS_FOR_MICRONUTRIENT_ANALYSIS);
    if (foodNames.length < 3) { 
      setMicronutrientError(t('micronutrientInsights.noDataLogged', {days: DAYS_FOR_MICRONUTRIENT_ANALYSIS}));
      setIsAnalyzingMicronutrients(false);
      return;
    }
    try {
      const result = await geminiService.getMicronutrientAnalysis(foodNames, i18n.language, currentUser);
      setMicronutrientAnalysis(result.analysisText);
    } catch (err) {
      setMicronutrientError(err instanceof Error ? err.message : t('micronutrientInsights.errorAnalysis'));
    } finally {
      setIsAnalyzingMicronutrients(false);
    }
  };

  const handleAddWater = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(waterInput);
    let unit: 'ml' | 'oz' = 'ml';
    if (waterInput.toLowerCase().includes('oz')) unit = 'oz';
    
    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      addWaterIntake(parsedAmount, unit);
      setWaterInput('');
    }
  };

  const handleAddSleep = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedDuration = parseFloat(sleepInput);
    if (!isNaN(parsedDuration) && parsedDuration > 0) {
      addSleepRecord(parsedDuration); 
      setSleepInput('');
    }
  };
  
  const todayYYYYMMDD = new Date().toISOString().split('T')[0];
  const todaysWaterRecords = getWaterIntakeForDate(todayYYYYMMDD);
  const todaysTotalWaterMl = todaysWaterRecords.reduce((sum, record) => {
    const amountInMl = record.unit === 'oz' ? record.amount * 29.5735 : record.amount;
    return sum + amountInMl;
  }, 0);

  const lastNightsSleep = getSleepRecordForDate(todayYYYYMMDD);


  const intakePercentage = effectiveCalorieGoal > 0 ? (todaysIntake.calories / effectiveCalorieGoal) * 100 : 0;
  const todaysLogEntries = dailyLog.filter(entry => entry.timestamp && new Date(entry.timestamp).toDateString() === new Date().toDateString()).sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));

  const getStatusColor = (status: ForecastValue['status']) => {
    switch (status) {
        case 'onTrack': return 'text-green-600';
        case 'slightlyOver': case 'significantlyOver': return 'text-red-600';
        case 'slightlyUnder': case 'significantlyUnder': return 'text-orange-600';
        default: return 'text-slate-500';
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-dark">{t('yourDashboard')}</h2>
        <button onClick={handleExportWeeklyPDF} disabled={isExportingPdf} className="mt-3 sm:mt-0 px-4 py-2 bg-secondary text-white font-medium rounded-lg shadow-md hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 transition-colors flex items-center space-x-2 text-sm disabled:opacity-70" aria-label={t('exportWeeklyPDF')}>
          {isExportingPdf ? <LoadingSpinner size="h-5 w-5"/> : React.cloneElement(ICONS.download, {className: "w-5 h-5"})}
          <span>{isExportingPdf ? t('exporting') : t('exportWeeklyPDF')}</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-card">
          <h3 className="text-xl font-semibold text-dark mb-3 flex items-center space-x-2"> {React.cloneElement(ICONS.target, {className:"w-6 h-6 text-primary"})} <span>{t('dailyCalorieGoal')}</span></h3>
          <form onSubmit={handleSetBaseGoal} className="space-y-3">
            <input type="number" value={newBaseGoal === 0 && userGoal.baseCalories > 0 ? '' : newBaseGoal.toString()} onChange={handleBaseGoalChange} placeholder={t('goalPlaceholder', {calories: userGoal.baseCalories})} min="1" className="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-focus focus:border-primary-focus sm:text-sm" aria-label={t('dailyCalorieGoal')} />
            <button type="submit" className="w-full px-6 py-3 bg-primary text-white font-medium rounded-lg shadow-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-2 transition-colors whitespace-nowrap">{t('setGoal')}</button>
          </form>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">{t('goalDescription')}</p>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-card">
          <h3 className="text-xl font-semibold text-dark mb-3">{t('fitnessMode')}</h3>
          <select value={currentFitnessMode} onChange={handleFitnessModeChange} className="w-full mt-1 block px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-focus focus:border-primary-focus sm:text-sm" aria-label={t('fitnessMode')}>
            {FITNESS_MODES.map(mode => <option key={mode.id} value={mode.id}>{t(mode.labelKey)} ({mode.calorieAdjustment > 0 ? `+${mode.calorieAdjustment}` : mode.calorieAdjustment} kcal)</option>)}
          </select>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">{t('modeDescription')}</p>
          <p className="mt-3 text-md font-semibold text-dark">{t('Effective Daily Goal')}: <span className="text-primary">{effectiveCalorieGoal.toFixed(0)} kcal</span></p>
        </div>
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-card">
        <h3 className="text-xl font-semibold text-dark mb-4 flex items-center space-x-2">{React.cloneElement(ICONS.trendingUp, {className:"w-6 h-6 text-primary"})} <span>{t('goalForecasting.title')}</span></h3>
        {isCalculatingForecasts ? <div className="flex flex-col items-center justify-center h-40"><LoadingSpinner /><p className="mt-2 text-slate-600">{t('goalForecasting.calculating')}</p></div>
        : forecasts ? <div className="space-y-5">
            {forecasts.weekly && <div><h4 className="text-md font-semibold text-slate-700 mb-2">{t('forecast.weeklyTitle')}</h4><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">{(Object.keys(forecasts.weekly) as Array<keyof NutrientForecasts>).map(key => <div key={`weekly-${key}`} className={`p-3 rounded-lg border ${forecasts.weekly![key].status === 'moreDataNeeded' ? 'bg-slate-50 border-slate-200' : 'bg-green-50 border-green-200'}`}><p className={`font-medium ${getStatusColor(forecasts.weekly![key].status)}`}>{forecasts.weekly![key].message}</p></div>)}</div></div>}
            {forecasts.monthly && <div><h4 className="text-md font-semibold text-slate-700 mb-2">{t('forecast.monthlyTitle')}</h4><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">{(Object.keys(forecasts.monthly) as Array<keyof NutrientForecasts>).map(key => <div key={`monthly-${key}`} className={`p-3 rounded-lg border ${forecasts.monthly![key].status === 'moreDataNeeded' ? 'bg-slate-50 border-slate-200' : 'bg-sky-50 border-sky-200'}`}><p className={`font-medium ${getStatusColor(forecasts.monthly![key].status)}`}>{forecasts.monthly![key].message}</p></div>)}</div></div>}
            <p className="text-xs text-slate-500 italic mt-3">{t('forecast.disclaimer')}</p></div>
        : <div className="text-center py-8 px-4 text-slate-500">{React.cloneElement(ICONS.info, {className:"w-10 h-10 mx-auto mb-2 text-slate-400"})}<p className="font-medium">{t('forecast.noDataOrGoal')}</p><p className="text-sm">{t('forecast.logMoreOrSetGoal')}</p></div>}
      </div>
      
      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-card">
        <h3 className="text-xl font-semibold text-dark mb-4">{t('todaysIntakeSummary')}</h3>
        <div className="mb-3">
            <h4 className="text-md font-semibold text-slate-700 mb-1">{t('macronutrientBreakdown.titleDaily')}</h4>
            <MacronutrientPieChart protein={todaysIntake.protein} carbs={todaysIntake.carbs} fat={todaysIntake.fat} />
        </div>
        <div className="mb-5">
          <div className="flex justify-between text-md sm:text-lg font-medium text-dark mb-1"><span>{todaysIntake.calories.toFixed(0)} kcal {t('consumed')}</span><span className="text-slate-600">{effectiveCalorieGoal.toFixed(0)} kcal {t('goal')}</span></div>
          <div className="w-full bg-slate-200 rounded-full h-5 sm:h-6 mt-1 overflow-hidden shadow-inner">
            <div className="bg-green-500 h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end text-xs text-white pr-2" style={{ width: `${Math.min(intakePercentage, 100)}%` }} role="progressbar" aria-valuenow={todaysIntake.calories} aria-valuemin={0} aria-valuemax={effectiveCalorieGoal}>{intakePercentage > 10 && `${intakePercentage.toFixed(0)}%`}</div>
          </div>
          {intakePercentage > 100 && <p className="text-sm text-red-600 font-medium mt-2 flex items-center space-x-1">{React.cloneElement(ICONS.info, {className: "w-4 h-4"})}<span>{t('exceededGoal')}</span></p>}
        </div>
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-card">
        <h3 className="text-xl font-semibold text-dark mb-4 flex items-center space-x-2">
          {React.cloneElement(ICONS.waterDrop, { className: "w-6 h-6 text-blue-500" })}
          <span>{t('waterIntake.title')}</span>
        </h3>
        <form onSubmit={handleAddWater} className="flex items-center space-x-2 mb-3">
          <input type="text" value={waterInput} onChange={(e) => setWaterInput(e.target.value)} placeholder={t('waterIntake.inputPlaceholder')} className="flex-grow p-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          <button type="submit" className="px-5 py-2.5 bg-blue-500 text-white font-medium rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 transition-colors">{t('waterIntake.addButton')}</button>
        </form>
        <div className="mb-3"><div className="flex justify-between text-sm font-medium text-dark"><span>{todaysTotalWaterMl.toFixed(0)} {t('waterIntake.ml')} {t('waterIntake.consumedToday')}</span><span className="text-slate-500">{DEFAULT_WATER_GOAL_ML} {t('waterIntake.ml')} {t('waterIntake.goal')}</span></div><div className="w-full bg-slate-200 rounded-full h-3 mt-1 overflow-hidden"><div className="bg-blue-500 h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${Math.min((todaysTotalWaterMl / DEFAULT_WATER_GOAL_ML) * 100, 100)}%` }}></div></div></div>
        {todaysWaterRecords.length > 0 && <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">{todaysWaterRecords.map(record => <li key={record.id} className="flex justify-between items-center p-1.5 bg-blue-50 rounded"><span>{record.amount} {record.unit} <span className="text-xs text-slate-500">({new Date(record.timestamp).toLocaleTimeString(i18n.language, {hour:'2-digit', minute:'2-digit'})})</span></span><button onClick={() => removeWaterIntake(record.id)} className="p-1 text-slate-400 hover:text-red-500 rounded-full" title={t('removeItem')}>{React.cloneElement(ICONS.trash, { className: "w-3.5 h-3.5" })}</button></li>)}</ul>}
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-card">
        <h3 className="text-xl font-semibold text-dark mb-4 flex items-center space-x-2">{React.cloneElement(ICONS.moon, { className: "w-6 h-6 text-indigo-500" })}<span>{t('sleepTracking.title')}</span></h3>
        <form onSubmit={handleAddSleep} className="flex items-center space-x-2 mb-3"><input type="text" value={sleepInput} onChange={(e) => setSleepInput(e.target.value)} placeholder={t('sleepTracking.inputPlaceholder')} className="flex-grow p-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" /><button type="submit" className="px-5 py-2.5 bg-indigo-500 text-white font-medium rounded-lg shadow-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 transition-colors">{t('sleepTracking.addButton')}</button></form>
        {lastNightsSleep ? <div className="text-sm"><p>{t('sleepTracking.lastNight')}: <span className="font-semibold">{lastNightsSleep.durationHours} {t('sleepTracking.hoursSuffix')}</span></p>{lastNightsSleep.quality && <p>{t('sleepTracking.quality')}: {t(`sleepTracking.qualityLevels.${lastNightsSleep.quality}`)}</p>}{lastNightsSleep.notes && <p className="text-xs text-slate-500 italic mt-1">{t('sleepTracking.notes')}: {lastNightsSleep.notes}</p>}<button onClick={() => removeSleepRecord(lastNightsSleep.id)} className="mt-1 p-1 text-xs text-red-500 hover:underline" title={t('removeItem')}>{t('sleepTracking.removeEntry')}</button></div> : <p className="text-sm text-slate-500">{t('sleepTracking.noSleepLoggedToday')}</p>}
        <div className="mt-2"><div className="flex justify-between text-xs font-medium text-dark"><span>{lastNightsSleep?.durationHours || 0} {t('sleepTracking.hoursSuffix')}</span><span className="text-slate-500">{DEFAULT_SLEEP_GOAL_HOURS} {t('sleepTracking.hoursSuffix')} {t('sleepTracking.goal')}</span></div><div className="w-full bg-slate-200 rounded-full h-2 mt-1 overflow-hidden"><div className="bg-indigo-500 h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${Math.min(((lastNightsSleep?.durationHours || 0) / DEFAULT_SLEEP_GOAL_HOURS) * 100, 100)}%` }}></div></div></div>
      </div>
      
      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-card">
        <h3 className="text-xl font-semibold text-dark mb-2 flex items-center space-x-2">{React.cloneElement(ICONS.aiSparkle, { className: "w-6 h-6 text-purple-500" })}<span>{t('micronutrientInsights.title')}</span></h3>
        <p className="text-sm text-slate-600 mb-4">{t('micronutrientInsights.description')}</p>
        <button onClick={handleAnalyzeMicronutrients} disabled={isAnalyzingMicronutrients} className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 text-white font-medium rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2 disabled:opacity-70">{isAnalyzingMicronutrients ? <LoadingSpinner size="h-5 w-5" /> : React.cloneElement(ICONS.aiSparkle, {className: "w-5 h-5"}) }<span>{isAnalyzingMicronutrients ? t('micronutrientInsights.analyzing') : t('micronutrientInsights.analyzeButton', {days: DAYS_FOR_MICRONUTRIENT_ANALYSIS})}</span></button>
        {isAnalyzingMicronutrients && <div className="mt-4 flex flex-col items-center justify-center p-3 bg-purple-50 rounded-lg"><LoadingSpinner /><p className="mt-2 text-purple-700 font-medium">{t('micronutrientInsights.analyzing')}</p></div>}
        {micronutrientError && <p className="mt-4 text-red-700 bg-red-100 p-3 rounded-lg text-sm flex items-center space-x-2" role="alert">{React.cloneElement(ICONS.info, {className: "w-5 h-5 flex-shrink-0"})}<span>{micronutrientError}</span></p>}
        {micronutrientAnalysis && !isAnalyzingMicronutrients && <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg"><h4 className="text-md font-semibold text-purple-800 mb-2">{t('micronutrientInsights.aiAnalysisResultTitle')}</h4><p className="text-sm text-purple-700 whitespace-pre-line">{micronutrientAnalysis}</p><p className="mt-3 text-xs text-slate-500 italic">{t('micronutrientInsights.disclaimer')}</p></div>}
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-card">
        <h3 className="text-xl font-semibold text-dark mb-4">{t('todaysLoggedFood')}</h3>
        {todaysLogEntries.length > 0 ? <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">{todaysLogEntries.map(item => <li key={item.id} className="flex justify-between items-center p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-sm transition-shadow">
          <div className="flex-grow">
            <p className="font-medium text-slate-800">{item.name} <span className="text-xs sm:text-sm text-slate-500">({item.quantity})</span></p>
            <p className="text-xs text-slate-600">{item.calories.toFixed(0)} kcal &bull; {t('proteinAbbr', 'P')}: {item.protein.toFixed(1)}g &bull; {t('carbsAbbr', 'C')}: {item.carbs.toFixed(1)}g &bull; {t('fatAbbr', 'F')}: {item.fat.toFixed(1)}g</p>
          </div>
          <div className="flex items-center space-x-1">
            <button onClick={() => shareMeal(item)} className="ml-2 sm:ml-3 p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-100 rounded-full transition-colors" title={t('feed.shareMealButton')} aria-label={`${t('feed.shareMealButton')} ${item.name}`}>{React.cloneElement(ICONS.share, {className:"w-4 h-4"})}</button>
            <button onClick={() => removeFoodFromLog(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors" title={t('removeItem')} aria-label={`${t('removeItem')} ${item.name}`}>{React.cloneElement(ICONS.trash, {className:"w-5 h-5"})}</button>
          </div>
        </li>)}</ul>
        : <div className="text-center py-8 px-4 text-slate-500">{React.cloneElement(ICONS.food, {className:"w-12 h-12 mx-auto mb-3 text-slate-400"})}<p className="font-medium">{t('noFoodLoggedToday')}</p><p className="text-sm">{t('goToTrackerPrompt')}</p></div>}
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-card">
        <h3 className="text-xl font-semibold text-dark mb-4">{t('weeklyCalorieTrend')}</h3>
        {weeklyData.some(d => d.calories > 0) ? <ResponsiveContainer width="100%" height={300}><BarChart data={weeklyData} margin={{ top: 5, right: 20, left: -25, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" stroke="#64748b" fontSize={12} /><YAxis stroke="#64748b" fontSize={12} unit="kcal" /><Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '0.5rem', borderColor: '#cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} itemStyle={{ color: '#334155' }} labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '4px' }} formatter={(value: number) => `${value.toFixed(0)} ${t('caloriesUnit', 'kcal')}`} labelFormatter={(label) => label} /><Legend wrapperStyle={{ color: '#475569', fontSize: '12px', paddingTop: '10px' }} formatter={(value) => t(value)} /><Bar dataKey="calories" fill="rgb(34, 197, 94)" name="calories" radius={[5, 5, 0, 0]} barSize={30} /></BarChart></ResponsiveContainer>
        : <div className="text-center py-12 px-4 text-slate-500">{React.cloneElement(ICONS.dashboard, {className:"w-12 h-12 mx-auto mb-3 text-slate-400"})}<p className="font-medium">{t('notEnoughDataForChart')}</p><p className="text-sm">{t('keepLoggingPrompt')}</p></div>}
      </div>
    </div>
  );
};

export default DashboardTab;
