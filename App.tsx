import React, { useState, useEffect, Suspense } from "react";
import TrackerTab from "@/components/TrackerTab";
import DashboardTab from "@/components/DashboardTab";
import SuggestionsTab from "@/components/SuggestionsTab";
import MealCalendarTab from "@/components/MealCalendarTab";
import DietPlanTab from "@/components/DietPlanTab";
import ProfileTab from "@/components/ProfileTab";
import ChatbotTab from "@/components/ChatbotTab";
import FeedTab from "@/components/FeedTab";
import ProgressTab from "@/components/ProgressTab";
import LoginModal from "@/components/auth/LoginModal";
import SignupModal from "@/components/auth/SignupModal";
import { NAV_ITEMS, APP_LOGO, ICONS } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { supportedLanguages } from "./src/i18n.js";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useDailyLog } from "@/contexts/DailyLogContext";

type TabId =
  | "tracker"
  | "dashboard"
  | "progress"
  | "feed"
  | "planner"
  | "suggestions"
  | "dietPlan"
  | "profile"
  | "chatbot";

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>("tracker");
  const [isTabChanging, setIsTabChanging] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(
    i18n.language.split("-")[0]
  );

  const { currentUser, logout, isLoading: isAuthLoading } = useAuth();
  const {
    isDailyLogLoading,
    isPlannedMealsLoading,
    isMilestonesLoading,
    isWaterRecordsLoading,
    isSleepRecordsLoading,
    isSharedFeedLoading,
    isChallengesLoading,
  } = useDailyLog();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  useEffect(() => {
    const baseLang = i18n.language.split("-")[0];
    if (baseLang !== currentLanguage) {
      setCurrentLanguage(baseLang);
    }
  }, [i18n.language, currentLanguage]);

  const handleTabChange = (tabId: TabId) => {
    if (tabId !== activeTab) {
      setIsTabChanging(true);
      setTimeout(() => {
        setActiveTab(tabId);
        setIsTabChanging(false);
      }, 150);
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setCurrentLanguage(lng);
  };

  const handleLogout = async () => {
    await logout();
    setActiveTab("tracker");
  };

  const openLoginModal = () => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  };
  const openSignupModal = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };
  const closeModal = () => {
    setShowLoginModal(false);
    setShowSignupModal(false);
  };

  const renderTabContent = () => {
    if (
      isAuthLoading ||
      isDailyLogLoading ||
      isPlannedMealsLoading ||
      isMilestonesLoading ||
      isWaterRecordsLoading ||
      isSleepRecordsLoading ||
      isSharedFeedLoading ||
      isChallengesLoading
    ) {
      return (
        <div className="flex flex-col items-center justify-center h-64 p-4">
          <LoadingSpinner size="h-12 w-12" />
          <p className="mt-4 text-lg text-slate-600">
            {t("loadingUserData", { defaultValue: "Loading your data..." })}
          </p>
        </div>
      );
    }
    switch (activeTab) {
      case "tracker":
        return <TrackerTab />;
      case "dashboard":
        return <DashboardTab />;
      case "progress":
        return <ProgressTab />;
      case "feed":
        return <FeedTab />;
      case "planner":
        return <MealCalendarTab />;
      case "suggestions":
        return <SuggestionsTab />;
      case "dietPlan":
        return <DietPlanTab />;
      case "profile":
        return <ProfileTab />;
      case "chatbot":
        return <ChatbotTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-light font-sans text-slate-800">
      <header className="bg-primary shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3 text-white">
            {React.cloneElement(APP_LOGO, { className: "w-9 h-9" })}
            <h1 className="text-xl font-bold tracking-tight">{t("appName")}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <nav className="hidden md:flex space-x-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id as TabId)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${
                      activeTab === item.id
                        ? "bg-green-700 text-white shadow-sm"
                        : "text-green-100 hover:bg-green-600 hover:text-white"
                    }`}
                >
                  {t(item.labelKey)}
                </button>
              ))}
            </nav>

            {currentUser ? (
              <div className="flex items-center space-x-2">
                <span
                  className="hidden sm:inline text-white text-sm font-medium truncate max-w-[120px]"
                  title={
                    currentUser.displayName ?? currentUser.email ?? undefined
                  }
                >
                  {React.cloneElement(ICONS.user, {
                    className: "w-4 h-4 inline mr-1",
                  })}
                  {currentUser.displayName || currentUser.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-md shadow-sm flex items-center space-x-1.5"
                >
                  {React.cloneElement(ICONS.logout, {
                    className: "w-4 h-4",
                  })}
                  <span>
                    {t("auth.logoutButton", { defaultValue: "Logout" })}
                  </span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={openLoginModal}
                  className="px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md flex items-center space-x-1.5"
                >
                  {React.cloneElement(ICONS.login, { className: "w-4 h-4" })}
                  <span>
                    {t("auth.loginButton", { defaultValue: "Login" })}
                  </span>
                </button>
                <button
                  onClick={openSignupModal}
                  className="px-2.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium rounded-md flex items-center space-x-1.5"
                >
                  {React.cloneElement(ICONS.userPlus, { className: "w-4 h-4" })}
                  <span>
                    {t("auth.signUpButton", { defaultValue: "Sign Up" })}
                  </span>
                </button>
              </div>
            )}

            <div className="relative">
              <select
                value={currentLanguage}
                onChange={(e) => changeLanguage(e.target.value)}
                className="bg-green-600 text-white text-xs py-1.5 pl-2 pr-7 rounded-md cursor-pointer"
              >
                {supportedLanguages.map((lang) => (
                  <option
                    key={lang.code}
                    value={lang.code}
                    className="text-dark"
                  >
                    {lang.name}
                  </option>
                ))}
              </select>
              {React.cloneElement(ICONS.language, {
                className:
                  "w-4 h-4 text-white absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none",
              })}
            </div>
          </div>
        </div>
      </header>

      <main
        className={`flex-grow container mx-auto p-3 transition-opacity duration-150 ${
          isTabChanging ? "opacity-0" : "opacity-100"
        }`}
      >
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="h-10 w-10" />
            </div>
          }
        >
          {renderTabContent()}
        </Suspense>
      </main>

      <LoginModal
        isOpen={showLoginModal}
        onClose={closeModal}
        onSwitchToSignup={openSignupModal}
      />
      <SignupModal
        isOpen={showSignupModal}
        onClose={closeModal}
        onSwitchToLogin={openLoginModal}
      />

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow z-40">
        <div className="flex justify-around">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id as TabId)}
              className={`flex-1 flex flex-col items-center justify-center p-2.5
                ${
                  activeTab === item.id
                    ? "text-primary"
                    : "text-slate-500 hover:text-primary"
                }`}
            >
              {React.cloneElement(item.icon, { className: "w-6 h-6 mb-0.5" })}
              <span className="text-xs font-medium">{t(item.labelKey)}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="md:hidden h-16"></div>

      <footer className="bg-slate-800 text-slate-400 text-center p-4 text-xs">
        <p>
          &copy; {new Date().getFullYear()} {t("appName")}.{" "}
          {t("tagline", { defaultValue: "Eat smart, live healthy." })}
        </p>
        <p>
          {t("poweredBy", {
            defaultValue: "Powered by AI and Nutrition Science",
          })}
        </p>
      </footer>
    </div>
  );
};

export default App;
