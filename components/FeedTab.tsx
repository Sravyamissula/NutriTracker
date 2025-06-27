
import React from 'react';
import { useDailyLog } from '../contexts/DailyLogContext';
import { ICONS } from '../constants';
import LoadingSpinner from './common/LoadingSpinner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const FeedTab: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();
  const { 
    sharedMealsFeed, 
    removeSharedMeal, 
    isSharedFeedLoading 
  } = useDailyLog();

  if (isSharedFeedLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-4">
        <LoadingSpinner size="h-12 w-12" />
        <p className="mt-4 text-lg text-slate-600">{t('feed.loadingFeed')}</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
        <div className="p-6 bg-white shadow-card rounded-xl text-center">
            <p className="text-lg text-slate-700">{t('feed.pleaseLoginToView')}</p>
        </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-white shadow-card rounded-xl">
      <div className="flex items-center space-x-2">
        {React.cloneElement(ICONS.users, { className: "w-8 h-8 text-primary" })}
        <h2 className="text-2xl font-semibold text-dark">{t('tabFeed')}</h2>
      </div>
      <p className="text-sm text-slate-600 -mt-3">{t('feed.description')}</p>

      {sharedMealsFeed.length === 0 ? (
        <div className="text-center py-10 px-4 text-slate-500">
          {React.cloneElement(ICONS.users, { className: "w-16 h-16 mx-auto mb-4 text-slate-300" })}
          <p className="font-medium text-lg">{t('feed.noSharedMeals')}</p>
          <p className="text-sm">{t('feed.shareFromDashboard')}</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {sharedMealsFeed.map(item => (
            <li key={item.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-slate-800 text-lg">{item.name}</p>
                  <p className="text-xs text-slate-500 mb-1">
                    {t('feed.sharedByOn', { 
                        displayName: item.sharedByUid === currentUser.uid ? t('feed.sharedByYou') : item.sharedByDisplayName, 
                        date: new Date(item.sharedAt).toLocaleString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                    })}
                  </p>
                </div>
                {item.sharedByUid === currentUser.uid && (
                  <button 
                    onClick={() => removeSharedMeal(item.id)} 
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors" 
                    title={t('feed.unshareMeal')}
                    aria-label={`${t('feed.unshareMeal')} ${item.name}`}
                  >
                    {React.cloneElement(ICONS.trash, { className: "w-5 h-5" })}
                  </button>
                )}
              </div>
              <div className="mt-2 text-sm text-slate-700">
                <p><strong>{t('calories')}:</strong> {item.calories.toFixed(0)} kcal</p>
                <p><strong>{t('protein')}:</strong> {item.protein.toFixed(1)}g</p>
                <p><strong>{t('carbs')}:</strong> {item.carbs.toFixed(1)}g</p>
                <p><strong>{t('fat')}:</strong> {item.fat.toFixed(1)}g</p>
                <p><strong>{t('servingSize')}:</strong> {item.quantity}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FeedTab;
