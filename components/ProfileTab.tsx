import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, ActivityLevelId, DietaryPreference } from '../types';
import { ICONS, ACTIVITY_LEVELS, COMMON_DIETARY_PREFERENCES } from '../constants';
import LoadingSpinner from './common/LoadingSpinner';
import { useTranslation } from 'react-i18next';

const ProfileTab: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser, updateUserProfile, isLoading: isAuthLoading } = useAuth();

  const [displayName, setDisplayName] = useState<string>(currentUser?.displayName || '');
  const [age, setAge] = useState<string>(currentUser?.age?.toString() || '');
  const [weight, setWeight] = useState<string>(currentUser?.weight?.toString() || ''); // in kg
  const [height, setHeight] = useState<string>(currentUser?.height?.toString() || ''); // in cm
  const [selectedDietaryPreferences, setSelectedDietaryPreferences] = useState<string[]>(currentUser?.dietaryPreferences || []);
  const [activityLevel, setActivityLevel] = useState<ActivityLevelId>(currentUser?.activityLevel || 'moderate');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || currentUser.email?.split('@')[0] || '');
      setAge(currentUser.age?.toString() || '');
      setWeight(currentUser.weight?.toString() || '');
      setHeight(currentUser.height?.toString() || '');
      setSelectedDietaryPreferences(currentUser.dietaryPreferences || []);
      setActivityLevel(currentUser.activityLevel || 'moderate');
    }
  }, [currentUser]);

  const handleDietaryPreferenceChange = (preferenceId: string) => {
    setSelectedDietaryPreferences(prev =>
      prev.includes(preferenceId)
        ? prev.filter(id => id !== preferenceId)
        : [...prev, preferenceId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);

    const profileData: Partial<User> = {
      displayName: displayName.trim() || undefined,
      age: age ? parseInt(age, 10) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      height: height ? parseInt(height, 10) : undefined,
      dietaryPreferences: selectedDietaryPreferences,
      activityLevel: activityLevel,
    };
    
    // Filter out undefined values explicitly if needed by backend, but for mock it's fine
    Object.keys(profileData).forEach(key => {
        const K = key as keyof typeof profileData;
        if (profileData[K] === undefined || (typeof profileData[K] === 'string' && (profileData[K] as string).trim() === '')) {
            delete profileData[K];
        }
         if (K === 'age' && isNaN(profileData[K] as number)) delete profileData[K];
         if (K === 'weight' && isNaN(profileData[K] as number)) delete profileData[K];
         if (K === 'height' && isNaN(profileData[K] as number)) delete profileData[K];
    });


    try {
      await updateUserProfile(profileData);
      setSaveStatus({ type: 'success', message: t('profile.successSave') });
    } catch (err) {
      console.error("Error updating profile:", err);
      setSaveStatus({ type: 'error', message: err instanceof Error ? err.message : t('profile.errorSave') });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  if (isAuthLoading && !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size="h-12 w-12" />
      </div>
    );
  }
  
  if (!currentUser) {
     return (
        <div className="p-6 bg-white shadow-card rounded-xl text-center">
            <p className="text-lg text-slate-700">{t('profile.pleaseLogin')}</p>
        </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-white shadow-card rounded-xl">
      <div className="flex items-center space-x-2">
        {React.cloneElement(ICONS.userCircle, { className: "w-8 h-8 text-primary" })}
        <h2 className="text-2xl font-semibold text-dark">{t('profile.title')}</h2>
      </div>
      <p className="text-sm text-slate-600 -mt-3">{t('profile.description')}</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-slate-700">{t('profile.displayName')}</label>
            <input type="text" id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 block w-full p-2.5 border-slate-300 rounded-lg shadow-sm focus:ring-primary-focus focus:border-primary-focus sm:text-sm" placeholder={currentUser.email?.split('@')[0]}/>
          </div>
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-slate-700">{t('profile.age')}</label>
            <input type="number" id="age" value={age} onChange={(e) => setAge(e.target.value)} min="0" max="120" className="mt-1 block w-full p-2.5 border-slate-300 rounded-lg shadow-sm focus:ring-primary-focus focus:border-primary-focus sm:text-sm" placeholder={t('profile.agePlaceholder')}/>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-slate-700">{t('profile.weightKg')}</label>
            <input type="number" id="weight" value={weight} onChange={(e) => setWeight(e.target.value)} min="0" step="0.1" className="mt-1 block w-full p-2.5 border-slate-300 rounded-lg shadow-sm focus:ring-primary-focus focus:border-primary-focus sm:text-sm" placeholder="e.g., 70.5"/>
          </div>
          <div>
            <label htmlFor="height" className="block text-sm font-medium text-slate-700">{t('profile.heightCm')}</label>
            <input type="number" id="height" value={height} onChange={(e) => setHeight(e.target.value)} min="0" className="mt-1 block w-full p-2.5 border-slate-300 rounded-lg shadow-sm focus:ring-primary-focus focus:border-primary-focus sm:text-sm" placeholder="e.g., 175"/>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.activityLevel.label')}</label>
          <select id="activityLevel" value={activityLevel} onChange={(e) => setActivityLevel(e.target.value as ActivityLevelId)} className="mt-1 block w-full p-2.5 border-slate-300 rounded-lg shadow-sm focus:ring-primary-focus focus:border-primary-focus sm:text-sm bg-white">
            {ACTIVITY_LEVELS.map(level => <option key={level.id} value={level.id}>{t(level.labelKey)}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.dietaryPreferences.label')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {COMMON_DIETARY_PREFERENCES.map((pref: DietaryPreference) => (
              <label key={pref.id} htmlFor={`diet-${pref.id}`} className="flex items-center space-x-2 p-2 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer transition-colors">
                <input type="checkbox" id={`diet-${pref.id}`} value={pref.id} checked={selectedDietaryPreferences.includes(pref.id)} onChange={() => handleDietaryPreferenceChange(pref.id)} className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary-focus"/>
                <span className="text-xs text-slate-700">{t(pref.labelKey)}</span>
              </label>
            ))}
          </div>
           <input type="text" id="otherDietaryPreferences" onChange={(e) => {
             const otherPref = e.target.value.trim();
             if (otherPref && !selectedDietaryPreferences.some(p => p.startsWith('other:'))) {
                setSelectedDietaryPreferences(prev => [...prev.filter(p => !p.startsWith('other:')), `other:${otherPref}`]);
             } else if (otherPref) {
                setSelectedDietaryPreferences(prev => prev.map(p => p.startsWith('other:') ? `other:${otherPref}` : p));
             } else {
                setSelectedDietaryPreferences(prev => prev.filter(p => !p.startsWith('other:')));
             }
           }} placeholder={t('profile.dietaryPreferences.otherPlaceholder')} className="mt-2 block w-full p-2 text-xs border-slate-300 rounded-lg shadow-sm focus:ring-primary-focus focus:border-primary-focus" defaultValue={selectedDietaryPreferences.find(p => p.startsWith('other:'))?.split(':')[1] || ''} />
        </div>

        <button type="submit" disabled={isSaving || isAuthLoading} className="w-full px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-2 transition-colors disabled:opacity-70 flex items-center justify-center">
          {isSaving ? <LoadingSpinner size="h-5 w-5" /> : t('profile.saveChanges')}
        </button>
      </form>

      {saveStatus && (
        <div className={`p-3 rounded-md text-sm mt-4 ${saveStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} role={saveStatus.type === 'error' ? 'alert' : 'status'}>
          {saveStatus.message}
        </div>
      )}
    </div>
  );
};

export default ProfileTab;
