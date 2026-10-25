import { useState } from "react";
import { Activity, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/authState";
import { translateAuthError } from "../utils/authErrors";
import "../landing.css";

export default function Login({ serviceError, sessionExpired = false }) {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login({ email, password });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="landing-page landing-auth-page">
      <div className="landing-noise" aria-hidden="true" />
      <header className="landing-header landing-auth-header">
        <Link className="landing-brand" to="/" aria-label={t("brand.home")}>
          <span className="landing-brand-mark" aria-hidden="true">
            <Activity size={19} strokeWidth={2.4} />
          </span>
          <span className="landing-brand-copy">
            <strong>CIPHER DESK</strong>
            <small>BY SIGLO CAPITAL</small>
          </span>
        </Link>
        <div className="landing-header-actions">
          <label className="landing-auth-language">
            <span>{t("language.label")}</span>
            <select
              aria-label={t("language.label")}
              value={i18n.resolvedLanguage === "es" ? "es" : "en"}
              onChange={(event) =>
                i18n.changeLanguage(event.target.value).catch((languageError) => {
                  console.error("Could not change login language:", languageError);
                })
              }
            >
              <option value="en">{t("language.english")}</option>
              <option value="es">{t("language.spanish")}</option>
            </select>
          </label>
          <Link className="landing-login-link landing-auth-back" to="/">
            <ArrowLeft size={15} aria-hidden="true" />
            {t("auth.backToLanding")}
          </Link>
        </div>
      </header>

      <div className="landing-auth-content">
        <section className="landing-auth-card" aria-labelledby="login-title">
          <p className="landing-eyebrow">
            <span />
            CIPHER DESK
          </p>
          <h1 id="login-title">{t("auth.title")}</h1>
          <p className="landing-auth-description">{t("auth.description")}</p>

          {(error || serviceError || sessionExpired) && (
            <p className="landing-auth-alert" role="alert">
              {error
                ? translateAuthError(error, t)
                : sessionExpired
                  ? t("auth.sessionExpired")
                  : translateAuthError(serviceError, t)}
            </p>
          )}

          <form className="landing-auth-form" onSubmit={submit}>
            <label>
              <span>{t("auth.email")}</span>
              <input
                required
                autoFocus
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              <span>{t("auth.password")}</span>
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button
              className="landing-button landing-button--primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? t("auth.signingIn") : t("auth.signIn")}
            </button>
          </form>

          <Link className="landing-auth-status" to="/status">
            {t("systemStatusPage.publicLink")}
          </Link>
        </section>
      </div>
    </main>
  );
}
