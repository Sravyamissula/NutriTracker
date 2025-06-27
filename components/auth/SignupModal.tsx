import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ICONS } from "../../constants";
import LoadingSpinner from "../common/LoadingSpinner";
import { useTranslation } from "react-i18next";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const SignupModal: React.FC<SignupModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
}) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { signup, isLoading, error: authError } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      emailRef.current?.focus();

      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };

      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError(t("auth.invalidEmail"));
      return;
    }

    if (password !== confirmPassword) {
      setFormError(t("auth.errorPasswordMismatch"));
      return;
    }

    if (password.length < 6) {
      setFormError(t("auth.errorPasswordLength"));
      return;
    }

    try {
      await signup(email, password);
      onClose();
    } catch (err) {
      console.error("Signup failed:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signupModalTitle"
      >
        <div className="flex justify-between items-center mb-6">
          <h2
            id="signupModalTitle"
            className="text-2xl font-bold text-dark flex items-center space-x-2"
          >
            {React.cloneElement(ICONS.userPlus, {
              className: "w-7 h-7 text-primary",
            })}
            <span>{t("auth.signUpTitle")}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={t("closeModal") || "Close modal"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-7 h-7"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {formError && (
          <p
            id="formErrorMsg"
            className="text-red-600 bg-red-100 p-3 rounded-md text-sm mb-4"
            role="alert"
          >
            {formError}
          </p>
        )}
        {authError && (
          <p
            className="text-red-600 bg-red-100 p-3 rounded-md text-sm mb-4"
            role="alert"
          >
            {authError}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="signup-email"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              {t("auth.email")}
            </label>
            <input
              type="email"
              id="signup-email"
              value={email}
              ref={emailRef}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-describedby={formError ? "formErrorMsg" : undefined}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-focus focus:border-primary-focus"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="signup-password"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              {t("auth.password")}
            </label>
            <input
              type="password"
              id="signup-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-focus focus:border-primary-focus"
              placeholder={t("auth.passwordPlaceholder")}
            />
          </div>
          <div>
            <label
              htmlFor="signup-confirm-password"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              {t("auth.confirmPassword")}
            </label>
            <input
              type="password"
              id="signup-confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-focus focus:border-primary-focus"
              placeholder={t("auth.confirmPasswordPlaceholder")}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-2 transition-colors disabled:opacity-70 flex items-center justify-center"
          >
            {isLoading ? (
              <LoadingSpinner size="h-5 w-5" />
            ) : (
              t("auth.signUpButton")
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-6">
          {t("auth.alreadyHaveAccount")}{" "}
          <button
            onClick={onSwitchToLogin}
            className="font-medium text-primary hover:text-primary-hover underline"
          >
            {t("auth.loginInstead")}
          </button>
        </p>
      </div>

      <style>{`
        @keyframes modalShow {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-modalShow {
          animation: modalShow 0.3s forwards cubic-bezier(0.165, 0.84, 0.44, 1);
        }
      `}</style>
    </div>
  );
};

export default SignupModal;
