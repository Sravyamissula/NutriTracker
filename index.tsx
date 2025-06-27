
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { DailyLogProvider } from './contexts/DailyLogContext';
import { AuthProvider } from './contexts/AuthContext'; // Import AuthProvider
import './src/i18n.js'; // Initialize i18next
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n.js';
import LoadingSpinner from './components/common/LoadingSpinner';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <React.Suspense fallback={<div className="flex justify-center items-center min-h-screen"><LoadingSpinner size="h-12 w-12" /></div>}>
      <I18nextProvider i18n={i18n}>
        <AuthProvider> {/* Wrap DailyLogProvider with AuthProvider */}
          <DailyLogProvider>
            <App />
          </DailyLogProvider>
        </AuthProvider>
      </I18nextProvider>
    </React.Suspense>
  </React.StrictMode>
);
