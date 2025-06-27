
import React from 'react';
import { FitnessMode, MealType, MilestoneDefinition, ActivityLevel, DietaryPreference, ChallengeDefinition, DailyLogEntry, Challenge, User } from './types';
import { DailyLogContextType } 
from './contexts/DailyLogContext';


export const GEMINI_FOOD_ID_MODEL = 'gemini-2.5-flash-preview-04-17';
export const GEMINI_NUTRITION_MODEL = 'gemini-2.5-flash-preview-04-17';
export const GEMINI_SUGGESTION_MODEL = 'gemini-2.5-flash-preview-04-17';
export const GEMINI_MICRONUTRIENT_MODEL = 'gemini-2.5-flash-preview-04-17';
export const GEMINI_DIET_PLAN_MODEL = 'gemini-2.5-flash-preview-04-17';
export const GEMINI_CHATBOT_MODEL = 'gemini-2.5-flash-preview-04-17';


export const DEFAULT_NUTRITION_SERVING_SIZE_G = 100;
export const DEFAULT_SERVING_QUANTITY = "1 serving";
export const DEFAULT_WATER_GOAL_ML = 2000;
export const DEFAULT_SLEEP_GOAL_HOURS = 8;

export const OPEN_FOOD_FACTS_API_URL = 'https://world.openfoodfacts.org/api/v2/product/';


export const APP_LOGO = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836A1.5 1.5 0 0112 3.5h.004c.484 0 .93.238 1.206.636l1.316 1.889A1.5 1.5 0 0015.82 7H16a4 4 0 014 4v2.586A2.5 2.5 0 0017.5 16h-11A2.5 2.5 0 004 13.586V11a4 4 0 014-4h.18a1.5 1.5 0 001.296-.975l1.316-1.889a1.5 1.5 0 01.558-.325zM7.5 16.5A1.5 1.5 0 019 18h6a1.5 1.5 0 011.5-1.5M12 11.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm3.5-1a1 1 0 100-2 1 1 0 000 2z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 10.5C6.0632 8.6368 7.8286 7.0701 10.5 6.5M18.75 10.5c-.8132 1.8632-2.5786 3.4299-5.25 3.96M12 21a9 9 0 110-18 9 9 0 010 18z" />
  </svg>
);

export const ICONS = {
  camera: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
    </svg>
  ),
  upload: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
  ),
  food: ( 
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9.75v2.25H2.25V9.75S4.5 3.75 12 3.75s9.75 6 9.75 6ZM21.75 12v6.75A2.25 2.25 0 0 1 19.5 21H4.5A2.25 2.25 0 0 1 2.25 18.75V12M12.75 9.75L12 3.75M11.25 9.75L12 3.75M12 21v-3.375" />
    </svg>
  ),
  dashboard: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
    </svg>
  ),
  plus: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  target: (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75v4.5M12 15.75v4.5M3.75 12h4.5M15.75 12h4.5M7.875 7.875l2.625 2.625M13.5 13.5l2.625 2.625" />
    </svg>
  ),
  lightbulb: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.355a7.5 7.5 0 0 1-4.5 0m4.5 0H12m0 0V9.75M12 9.75c0-1.125.75-2.066 1.758-2.355A4.478 4.478 0 0 1 15.75 6c0-1.05-.5-1.996-1.328-2.615A4.478 4.478 0 0 0 12 2.25a4.478 4.478 0 0 0-2.422 1.135A4.478 4.478 0 0 0 8.25 6c0 .762.214 1.48.588 2.088A5.98 5.98 0 0 0 12 9.75Z" />
    </svg>
  ),
  aiSparkle: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12L17 14.188l-1.25-2.188a2.25 2.25 0 00-1.7-1.7L12 9.25l2.188-1.25a2.25 2.25 0 001.7-1.7L17 4.25l1.25 2.188a2.25 2.25 0 001.7 1.7L22.75 9.25l-2.188 1.25a2.25 2.25 0 00-1.7 1.7z" />
    </svg>
  ),
  trash: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  ),
  info: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  ),
  syncLoop: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  ),
  download: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
  language: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
    </svg>
  ),
  user: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  ),
  logout: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9M3 12h6" />
    </svg>
  ),
  login: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15m0 0H9m6 0v-2.25" />
    </svg>
  ),
  userPlus: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
    </svg>
  ),
  trendingUp: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
  ),
  calendarDays: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-3.75h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
    </svg>
  ),
  microphone: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15c.621 0 1.125-.504 1.125-1.125V6.375c0-.621-.504-1.125-1.125-1.125S10.875 5.754 10.875 6.375v7.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  ),
  handRaised: ( 
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
    </svg>
  ),
  barcode: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5A.75.75 0 014.5 3.75h15a.75.75 0 01.75.75v15a.75.75 0 01-.75.75h-15a.75.75 0 01-.75-.75v-15z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25v7.5M10.5 8.25v7.5M13.5 8.25v7.5M16.5 8.25v7.5M7.5 12h9" />
    </svg>
  ),
  flame: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.608a8.287 8.287 0 003 2.472A8.288 8.288 0 0015.362 5.214z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75C12.966 18.75 13.83 17.604 13.83 16.125c0-1.479-.864-2.625-1.83-2.625s-1.83 1.146-1.83 2.625c0 1.479.864 2.625 1.83 2.625z" />
    </svg>
  ),
  badge: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  award: (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A3.375 3.375 0 0012.75 9.75H11.25A3.375 3.375 0 007.5 13.125V18.75m4.363-1.636a.75.75 0 010-1.06l2.02-2.02a.75.75 0 011.061 0l2.02 2.02a.75.75 0 010 1.06l-2.02 2.02a.75.75 0 01-1.06 0l-2.02-2.02zM12 2.25v2.25m0-2.25a.75.75 0 00-.75.75M12 2.25a.75.75 0 01.75.75M12 4.5v3.75m0-3.75a3.375 3.375 0 01-3.375 3.375H7.5A3.375 3.375 0 014.125 4.5m7.875 0a3.375 3.375 0 003.375 3.375h1.125A3.375 3.375 0 0019.875 4.5m-7.875 0v3.75" />
    </svg>
  ),
  targetAchieved: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75v4.5m0 7.5v4.5m-8.25-7.5h4.5m7.5 0h4.5M7.875 7.875l2.625 2.625M13.5 13.5l2.625 2.625" />
    </svg>
  ),
  calendarCheck: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5M9 12.75L11.25 15 15 9.75" />
    </svg>
  ),
  documentText: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  userCircle: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  chatBubbleLeftRight: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3.68-3.091a4.501 4.501 0 00-3.091-1.1H5.25c-1.136 0-2.1-.847-2.193-1.98A4.501 4.501 0 012.25 12.75V8.511c0-.97.616-1.813 1.5-2.097m16.5 0c.884.284 1.5 1.128 1.5 2.097V6.25c0-1.136-.847-2.1-1.98-2.193-.34-.027-.68-.052-1.02-.072V.75L11.25 3.75m5.25 0c-.482 0-.973.056-1.452.165M18 2.25v3.5m0 0A2.25 2.25 0 0015.75 8.25H5.25A2.25 2.25 0 003 10.5m15 0v.001M3.75 10.5a2.25 2.25 0 012.25-2.25h10.5a2.25 2.25 0 012.25 2.25v4.286c0 .447-.18.869-.483 1.182a4.504 4.504 0 01-1.031.657l-3.68 3.091v-3.091A4.501 4.501 0 0010.5 15.75H5.25A2.25 2.25 0 013 13.5V8.511c0-.447.18.869.483-1.182.303-.313.73-.493 1.182-.498V8.25" />
    </svg>
  ),
  waterDrop: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25C12 2.25 6.75 7.5 6.75 12.75c0 4.142 3.019 7.5 5.25 7.5s5.25-3.358 5.25-7.5C17.25 7.5 12 2.25 12 2.25zM12 12.75a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
    </svg>
  ),
  moon: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  ),
  share: ( // New icon for sharing
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.523.583 1.372 1.855 1.372 3.049V16.5a.75.75 0 001.5 0v-2.31c0-1.194-.849-2.466-1.372-3.049M16.5 12.75a2.25 2.25 0 100-2.186m0 2.186c-.523.583-1.372 1.855-1.372 3.049V16.5a.75.75 0 01-1.5 0v-2.31c0-1.194.849-2.466 1.372-3.049M12 12a2.25 2.25 0 100-2.186m0 2.186A2.25 2.25 0 0012 12zm0 0V6.75m0 5.25V17.25" />
    </svg>
  ),
  users: ( // New icon for Feed tab (simple group icon)
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-3.741-3.741M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 4.5a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75V17.25a.75.75 0 01.75-.75h1.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H12.75a.75.75 0 01-.75-.75V12.75zM12 9.75A.75.75 0 0011.25 9h-.008a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008A.75.75 0 0012 9.75v-.008zM7.5 12.75a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H8.25a.75.75 0 01-.75-.75V12.75zM15 12.75a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H15.75a.75.75 0 01-.75-.75V12.75z" />
    </svg>
  ),
};

export const FITNESS_MODES: FitnessMode[] = [
  { id: 'maintenance', labelKey: 'modeMaintenance', calorieAdjustment: 0 },
  { id: 'weightLoss', labelKey: 'modeWeightLoss', calorieAdjustment: -300 },
  { id: 'muscleGain', labelKey: 'modeMuscleGain', calorieAdjustment: 300 },
];

export const NAV_ITEMS = [
  { id: 'tracker', labelKey: 'tabTracker', icon: ICONS.food },
  { id: 'dashboard', labelKey: 'tabDashboard', icon: ICONS.dashboard },
  { id: 'progress', labelKey: 'tabProgress', icon: ICONS.award },
  { id: 'feed', labelKey: 'tabFeed', icon: ICONS.users },
  { id: 'planner', labelKey: 'tabPlanner', icon: ICONS.calendarDays },
  { id: 'suggestions', labelKey: 'tabSuggestions', icon: ICONS.lightbulb },
  { id: 'dietPlan', labelKey: 'tabDietPlan', icon: ICONS.documentText },
  { id: 'profile', labelKey: 'tabProfile', icon: ICONS.userCircle },
  { id: 'chatbot', labelKey: 'tabChatbot', icon: ICONS.chatBubbleLeftRight },
];

export const MEAL_TYPES: MealType[] = [
  { id: 'breakfast', labelKey: 'mealTypes.breakfast' },
  { id: 'lunch', labelKey: 'mealTypes.lunch' },
  { id: 'dinner', labelKey: 'mealTypes.dinner' },
  { id: 'snack', labelKey: 'mealTypes.snack' },
];

export const MEAL_TYPE_SUGGESTION_OPTIONS = [
  { value: 'any', labelKey: 'suggestions.mealTypeAny' },
  { value: 'breakfast', labelKey: 'mealTypes.breakfast' },
  { value: 'lunch', labelKey: 'mealTypes.lunch' },
  { value: 'dinner', labelKey: 'mealTypes.dinner' },
  { value: 'snack', labelKey: 'mealTypes.snack' },
];

export const DIET_PLAN_DURATION_OPTIONS = [
  { value: 1, labelKey: 'dietPlan.duration.1day' },
  { value: 3, labelKey: 'dietPlan.duration.3days' },
  { value: 7, labelKey: 'dietPlan.duration.7days' },
];

export const DEFAULT_MACRO_PERCENTAGES = {
  protein: 30,
  carbs: 40,
  fat: 30,
};


export const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  {
    id: 'firstLog',
    nameKey: 'milestones.firstLog.name',
    descriptionKey: 'milestones.firstLog.description',
    icon: React.cloneElement(ICONS.badge, { className: "w-7 h-7 text-green-500" }),
    condition: (log) => log.length > 0,
  },
  {
    id: 'streak3',
    nameKey: 'milestones.streak3.name',
    descriptionKey: 'milestones.streak3.description',
    icon: React.cloneElement(ICONS.flame, { className: "w-7 h-7 text-orange-500" }),
    condition: (_log, streak) => streak >= 3,
  },
  {
    id: 'streak7',
    nameKey: 'milestones.streak7.name',
    descriptionKey: 'milestones.streak7.description',
    icon: React.cloneElement(ICONS.award, { className: "w-7 h-7 text-yellow-500" }),
    condition: (_log, streak) => streak >= 7,
  },
  {
    id: 'logged10ItemsToday', // Changed from logged10Items for clarity
    nameKey: 'milestones.logged10ItemsToday.name',
    descriptionKey: 'milestones.logged10ItemsToday.description',
    icon: React.cloneElement(ICONS.food, { className: "w-7 h-7 text-sky-500" }),
    condition: (log) => {
        const today = new Date().toDateString();
        const distinctFoodNamesToday = new Set(
            log.filter(entry => entry.timestamp && new Date(entry.timestamp).toDateString() === today)
               .map(entry => entry.name.toLowerCase())
        );
        return distinctFoodNamesToday.size >= 10; 
    }
  },
   {
    id: 'logged50ItemsTotal', // Changed for clarity
    nameKey: 'milestones.logged50ItemsTotal.name',
    descriptionKey: 'milestones.logged50ItemsTotal.description',
    icon: React.cloneElement(ICONS.targetAchieved, { className: "w-7 h-7 text-rose-500" }),
    condition: (log) => {
        return log.length >= 50;
    }
  },
  {
    id: 'plannerPro',
    nameKey: 'milestones.plannerPro.name',
    descriptionKey: 'milestones.plannerPro.description',
    icon: React.cloneElement(ICONS.calendarCheck, { className: "w-7 h-7 text-purple-500" }),
    condition: (_log, _streak, context) => {
        // Ensure context.plannedMeals is accessed safely
        return context?.plannedMeals && context.plannedMeals.length >= 5;
    }
  },
   {
    id: 'goalSetter',
    nameKey: 'milestones.goalSetter.name',
    descriptionKey: 'milestones.goalSetter.description',
    icon: React.cloneElement(ICONS.target, { className: "w-7 h-7 text-teal-500" }),
    condition: (_log, _streak, context) => {
        const isGoalCustom = context?.userGoal?.baseCalories !== 2000; 
        const isModeCustom = context?.currentFitnessMode !== 'maintenance'; 
        return isGoalCustom || isModeCustom;
    }
  }
];

export const ACTIVITY_LEVELS: ActivityLevel[] = [
  { id: 'sedentary', labelKey: 'profile.activityLevels.sedentary' },
  { id: 'light', labelKey: 'profile.activityLevels.light' },
  { id: 'moderate', labelKey: 'profile.activityLevels.moderate' },
  { id: 'active', labelKey: 'profile.activityLevels.active' },
  { id: 'veryActive', labelKey: 'profile.activityLevels.veryActive' },
];

export const COMMON_DIETARY_PREFERENCES: DietaryPreference[] = [
  { id: 'vegetarian', labelKey: 'profile.dietaryPreferences.vegetarian' },
  { id: 'vegan', labelKey: 'profile.dietaryPreferences.vegan' },
  { id: 'gluten_free', labelKey: 'profile.dietaryPreferences.gluten_free' },
  { id: 'dairy_free', labelKey: 'profile.dietaryPreferences.dairy_free' },
  { id: 'nut_free', labelKey: 'profile.dietaryPreferences.nut_free' },
  { id: 'low_carb', labelKey: 'profile.dietaryPreferences.low_carb' },
  { id: 'keto', labelKey: 'profile.dietaryPreferences.keto' },
  { id: 'paleo', labelKey: 'profile.dietaryPreferences.paleo' },
];

export const CHALLENGE_DEFINITIONS: ChallengeDefinition[] = [
  {
    id: 'logStreak5',
    nameKey: 'challenges.logStreak5.name',
    descriptionKey: 'challenges.logStreak5.description',
    icon: React.cloneElement(ICONS.flame, { className: "w-6 h-6 text-deep-orange-500" }),
    rewardPoints: 50,
    condition: (_log, streak) => streak >= 5,
  },
  {
    id: 'logStreak14',
    nameKey: 'challenges.logStreak14.name',
    descriptionKey: 'challenges.logStreak14.description',
    icon: React.cloneElement(ICONS.award, { className: "w-6 h-6 text-amber-600" }),
    rewardPoints: 150,
    condition: (_log, streak) => streak >= 14,
  },
  {
    id: 'try3NewFoodsToday',
    nameKey: 'challenges.try3NewFoodsToday.name',
    descriptionKey: 'challenges.try3NewFoodsToday.description',
    icon: React.cloneElement(ICONS.food, { className: "w-6 h-6 text-lime-600" }),
    rewardPoints: 30,
    condition: (log) => {
      const today = new Date().toDateString();
      const todaysFoodNames = new Set(
        log.filter(entry => entry.timestamp && new Date(entry.timestamp).toDateString() === today)
           .map(entry => entry.name.toLowerCase())
      );
      return todaysFoodNames.size >= 3;
    },
  },
  {
    id: 'planFullWeek',
    nameKey: 'challenges.planFullWeek.name',
    descriptionKey: 'challenges.planFullWeek.description',
    icon: React.cloneElement(ICONS.calendarCheck, { className: "w-6 h-6 text-cyan-600" }),
    rewardPoints: 75,
    condition: (_log, _streak, context) => {
        if (!context.plannedMeals) return false;
        // Check if there's at least one meal planned for 7 distinct upcoming or recent days
        const plannedDays = new Set(context.plannedMeals.map(pm => pm.plannedDate));
        return plannedDays.size >= 7;
    }
  },
  {
    id: 'hydrationHeroToday',
    nameKey: 'challenges.hydrationHeroToday.name',
    descriptionKey: 'challenges.hydrationHeroToday.description',
    icon: React.cloneElement(ICONS.waterDrop, { className: "w-6 h-6 text-blue-500" }),
    rewardPoints: 20,
    condition: (_log, _streak, context) => {
        if (!context.waterIntakeRecords) return false;
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysWater = context.waterIntakeRecords
            .filter(r => r.date === todayStr)
            .reduce((sum, r) => sum + (r.unit === 'oz' ? r.amount * 29.5735 : r.amount), 0);
        return todaysWater >= DEFAULT_WATER_GOAL_ML;
    }
  },
  {
    id: 'sleepChampionToday',
    nameKey: 'challenges.sleepChampionToday.name',
    descriptionKey: 'challenges.sleepChampionToday.description',
    icon: React.cloneElement(ICONS.moon, { className: "w-6 h-6 text-indigo-500" }),
    rewardPoints: 20,
    condition: (_log, _streak, context) => {
        if(!context.sleepRecords) return false;
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysSleep = context.sleepRecords.find(r => r.date === todayStr);
        return todaysSleep ? todaysSleep.durationHours >= DEFAULT_SLEEP_GOAL_HOURS : false;
    }
  },
];
