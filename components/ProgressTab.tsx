
import React from 'react';
import { useDailyLog } from '../contexts/DailyLogContext';
import { ICONS, MILESTONE_DEFINITIONS, CHALLENGE_DEFINITIONS } from '../constants';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from './common/LoadingSpinner';

const ProgressTab: React.FC = () => {
  const { t, i18n } = useTranslation();
  const {
    loggingStreak,
    achievedMilestones,
    userPoints,
    completedChallenges,
    isMilestonesLoading,
    isChallengesLoading,
  } = useDailyLog();

  if (isMilestonesLoading || isChallengesLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size="h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6 bg-white shadow-card rounded-xl">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-dark flex items-center space-x-2">
            {React.cloneElement(ICONS.award, {className: "w-8 h-8 text-primary"})}
            <span>{t('progress.achievementsTitle')}</span>
        </h2>
      </div>

      <div className="bg-slate-50 p-5 sm:p-6 rounded-xl border border-slate-200">
        <h3 className="text-xl font-semibold text-dark mb-4">{t('progress.keyStatsTitle')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-white border border-orange-200 rounded-lg shadow-sm">
            <div className="w-12 h-12 mx-auto text-orange-500 flex items-center justify-center">{React.cloneElement(ICONS.flame, {className: 'w-10 h-10'})}</div>
            <p className="text-3xl font-bold text-orange-600 mt-2">{loggingStreak}</p>
            <p className="text-sm text-slate-600 mt-1">{t('progress.loggingStreak')}</p>
          </div>
          <div className="p-4 bg-white border border-amber-200 rounded-lg shadow-sm">
            <div className="w-12 h-12 mx-auto text-amber-500 flex items-center justify-center">{React.cloneElement(ICONS.award, {className: 'w-10 h-10'})}</div>
            <p className="text-3xl font-bold text-amber-600 mt-2">{userPoints}</p>
            <p className="text-sm text-slate-600 mt-1">{t('challenges.totalPoints')}</p>
          </div>
          <div className="p-4 bg-white border border-green-200 rounded-lg shadow-sm">
            <div className="w-12 h-12 mx-auto text-green-500 flex items-center justify-center">{React.cloneElement(ICONS.badge, {className: 'w-10 h-10'})}</div>
            <p className="text-3xl font-bold text-green-600 mt-2">{achievedMilestones.length}<span className="text-lg text-slate-500">/{MILESTONE_DEFINITIONS.length}</span></p>
            <p className="text-sm text-slate-600 mt-1">{t('progress.milestonesAchieved')}</p>
          </div>
          <div className="p-4 bg-white border border-sky-200 rounded-lg shadow-sm">
            <div className="w-12 h-12 mx-auto text-sky-500 flex items-center justify-center">{React.cloneElement(ICONS.targetAchieved, {className: 'w-10 h-10'})}</div>
            <p className="text-3xl font-bold text-sky-600 mt-2">{completedChallenges.length}<span className="text-lg text-slate-500">/{CHALLENGE_DEFINITIONS.length}</span></p>
            <p className="text-sm text-slate-600 mt-1">{t('progress.challengesCompleted')}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-dark">{t('progress.milestonesTitle')}</h3>
        <p className="text-sm text-slate-500 mb-4">{t('progress.milestonesDescription')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {MILESTONE_DEFINITIONS.map(def => {
            const achieved = achievedMilestones.find(am => am.id === def.id);
            const isAchieved = !!achieved;
            return (
              <div key={def.id} title={isAchieved ? `${t(def.nameKey)} - ${t('achievedOn')}: ${new Date(achieved.achievedDate).toLocaleDateString(i18n.language)}` : `${t(def.nameKey)} - ${t('progress.locked')}`} className={`p-4 rounded-lg text-center border-2 transition-all duration-300 transform hover:scale-105 ${isAchieved ? 'border-green-400 bg-green-50 shadow-md' : 'border-slate-200 bg-slate-100 opacity-70'}`}>
                <div className={`mx-auto w-12 h-12 flex items-center justify-center rounded-full transition-colors duration-300 ${isAchieved ? 'bg-green-500' : 'bg-slate-400'}`}>
                  {React.cloneElement(def.icon, { className: 'w-7 h-7 text-white' })}
                </div>
                <p className="text-sm font-semibold mt-2 text-dark h-10 flex items-center justify-center">{t(def.nameKey)}</p>
                {isAchieved ? (
                  <p className="text-xs text-green-600 font-medium mt-2">{t('achievedOn')}: {new Date(achieved.achievedDate).toLocaleDateString(i18n.language)}</p>
                ) : (
                  <p className="text-xs text-slate-500 font-medium mt-2">{t('progress.locked')}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
       <div>
         <h3 className="text-xl font-semibold text-dark">{t('progress.challengesTitle')}</h3>
         <p className="text-sm text-slate-500 mb-4">{t('progress.challengesDescription')}</p>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CHALLENGE_DEFINITIONS.map(def => {
                const completed = completedChallenges.find(cc => cc.id === def.id);
                const isCompleted = !!completed;
                return (
                    <div key={def.id} title={isCompleted ? `${t(def.nameKey)} - ${t('progress.completedOn')}: ${new Date(completed.completedDate).toLocaleDateString(i18n.language)}` : `${t(def.nameKey)} - ${t('challenges.pointsAwarded', { points: def.rewardPoints })}`} className={`p-4 rounded-lg flex items-center space-x-4 border-2 transition-all duration-300 ${isCompleted ? 'border-sky-400 bg-sky-50 shadow-md' : 'border-slate-200 bg-slate-100 opacity-80'}`}>
                        <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-300 ${isCompleted ? 'bg-sky-500' : 'bg-slate-400'}`}>
                           {React.cloneElement(def.icon, { className: 'w-6 h-6 text-white' })}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-dark">{t(def.nameKey)}</p>
                            {isCompleted ? (
                                <p className="text-xs text-sky-600 font-medium mt-1">{t('progress.completedOn')}: {new Date(completed.completedDate).toLocaleDateString(i18n.language)}</p>
                            ) : (
                                <p className="text-xs text-amber-600 font-medium mt-1">{t('challenges.pointsAwarded', { points: def.rewardPoints })}</p>
                            )}
                        </div>
                    </div>
                )
            })}
         </div>
      </div>

    </div>
  );
};

export default ProgressTab;
