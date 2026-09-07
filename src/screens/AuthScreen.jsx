import { useEffect, useRef, useState } from "react";
import { isDemo } from "../lib/supabase";
import { authService } from "../services/auth";
import { authFormIssues, authErrorMessage } from "../lib/auth-form";
import "./auth.css";

export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [issues, setIssues] = useState({});
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [resendAt, setResendAt] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [resent, setResent] = useState(false);
  const pending = useRef(false);
  const mounted = useRef(true);
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const headingRef = useRef(null);
  const initialView = useRef(true);
  const signup = mode === "signup";
  const reset = mode === "reset";

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (initialView.current) { initialView.current = false; return; }
    headingRef.current?.focus();
  }, [mode, confirmation]);

  useEffect(() => {
    if (!resendAt) { setSecondsLeft(0); return; }
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [resendAt]);

  function changeMode(next) {
    if (pending.current) return;
    setMode(next);
    setIssues({});
    setError("");
    setConfirmation(null);
    setPassword("");
    setShowPassword(false);
    setResent(false);
    setResendAt(0);
  }

  function fieldChange(field, value) {
    ({ email: setEmail, password: setPassword, name: setName })[field](value);
    setIssues(previous => ({ ...previous, [field]: undefined }));
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    const validation = authFormIssues({ mode, name, email, password });
    setIssues(validation);
    setError("");
    const first = ["name", "email", "password"].find(field => validation[field]);
    if (first) {
      ({ name: nameRef, email: emailRef, password: passwordRef })[first].current?.focus();
      return;
    }
    pending.current = true;
    setBusy(true);
    const address = email.trim();
    try {
      if (reset) {
        const result = await authService.resetPassword(address);
        if (!mounted.current) return;
        if (result.error) throw result.error;
        setConfirmation({ kind: "reset", email: address });
      } else if (isDemo) {
        onLogin({ name: name.trim() || "Traveler", email: address });
      } else {
        const result = signup
          ? await authService.signUp({ email: address, password, name: name.trim(), avatar: "😎" })
          : await authService.signIn({ email: address, password });
        if (!mounted.current) return;
        if (result.error) throw result.error;
        if (!result.user) throw new Error("We couldn't finish signing you in. Please try again.");
        if (signup && !result.session) {
          setConfirmation({ kind: "signup", email: address });
          setResendAt(Date.now() + 60000);
          setPassword("");
          setShowPassword(false);
        } else onLogin(result.user);
      }
    } catch (failure) {
      if (mounted.current) setError(authErrorMessage(failure));
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function resendConfirmation() {
    if (pending.current || !confirmation || Date.now() < resendAt) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setResent(false);
    try {
      const result = await authService.resendConfirmation(confirmation.email);
      if (!mounted.current) return;
      if (result.error) throw result.error;
      setResent(true);
      setResendAt(Date.now() + 60000);
    } catch (failure) {
      if (mounted.current) setError(authErrorMessage(failure));
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  const title = confirmation ? "Check your inbox." : reset ? "Let's get you back in." : signup ? "Find your travel people." : "Welcome back.";

  return <div className="auth-page">
    <header className="auth-header">
      <a className="auth-brand" href="/" aria-label="Baddie home">baddie<span>travel together</span></a>
      <a className="auth-back" href="/">Back to explore <span aria-hidden="true">↗</span></a>
    </header>
    <div className="auth-layout">
      <aside className="auth-scene" aria-label="Travel together">
        <img src="/images/coastal-companions.webp" alt="Three travelers walking together along a sunlit coastal path." width="1000" height="1250" fetchpriority="high" />
        <div className="auth-scene-copy">
          <span className="auth-scene-label">A little further. Together.</span>
          <h2>Good trips.<br /><em>Great company.</em></h2>
          <p>Find people going your way. Turn shared plans into your next adventure.</p>
        </div>
      </aside>
      <main className="auth-panel" aria-labelledby="auth-heading">
        <div className="auth-form-wrap">
          <div className="auth-intro">
            <span className="auth-kicker">{confirmation ? "One more step" : reset ? "Password recovery" : signup ? "Your next adventure" : "Your crew is out there"}</span>
            <h1 id="auth-heading" ref={headingRef} tabIndex={-1}>{title}</h1>
            {!confirmation && <p>{reset ? "Enter your email and we'll help you reset your password." : signup ? "Create an account to match, chat, and plan trips together." : "Sign in to find your people and pick up your plans."}</p>}
          </div>
          {isDemo && <p className="auth-demo">Demo mode · Explore without creating a real account.</p>}
          {confirmation ? <div className="auth-confirmation">
            <span className="auth-mail-mark" aria-hidden="true">✉</span>
            <p>{confirmation.kind === "reset" ? "If there's an account for this email, you'll receive a password-reset link:" : "We sent a confirmation link to:"}</p>
            <strong className="auth-email-address">{confirmation.email}</strong>
            <p className="auth-confirmation-note">{confirmation.kind === "reset" ? "Open the link to choose a new password. Check your spam folder if it doesn't arrive." : "Open the link to activate your account, then come back and sign in. Check your spam folder too."}</p>
            {error && <p className="auth-notice auth-notice-error" role="alert">{error}</p>}
            {resent && <p className="auth-notice auth-notice-success" role="status">Another confirmation email is on its way.</p>}
            <button className="auth-primary" type="button" disabled={busy} onClick={() => changeMode("login")}>Back to sign in <span aria-hidden="true">→</span></button>
            {confirmation.kind === "signup" && <button className="auth-resend" type="button" disabled={busy || secondsLeft > 0} onClick={resendConfirmation}>
              {busy ? "Sending…" : secondsLeft > 0 ? `Resend email in ${secondsLeft}s` : "Resend confirmation email"}
            </button>}
            <button className="auth-link auth-change-email" type="button" disabled={busy} onClick={() => changeMode(confirmation.kind === "signup" ? "signup" : "reset")}>Use a different email</button>
          </div> : <>
            <form className="auth-form" onSubmit={submit} noValidate aria-busy={busy}>
              {signup && <div className="auth-field">
                <label htmlFor="auth-name">Your name</label>
                <input ref={nameRef} id="auth-name" name="name" autoComplete="name" value={name} onChange={e => fieldChange("name", e.target.value)} placeholder="What should we call you?" required disabled={busy} aria-invalid={!!issues.name} aria-describedby={issues.name ? "auth-name-error" : undefined} />
                {issues.name && <p className="auth-field-error" id="auth-name-error">{issues.name}</p>}
              </div>}
              <div className="auth-field">
                <label htmlFor="auth-email">Email address</label>
                <input ref={emailRef} id="auth-email" name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={e => fieldChange("email", e.target.value)} placeholder="you@example.com" required disabled={busy} aria-invalid={!!issues.email} aria-describedby={issues.email ? "auth-email-error" : undefined} />
                {issues.email && <p className="auth-field-error" id="auth-email-error">{issues.email}</p>}
              </div>
              {!reset && <div className="auth-field">
                <div className="auth-label-row"><label htmlFor="auth-password">Password</label>{!signup && <button className="auth-link" type="button" disabled={busy} onClick={() => changeMode("reset")}>Forgot password?</button>}</div>
                <div className="auth-password">
                  <input ref={passwordRef} id="auth-password" name="password" type={showPassword ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} value={password} onChange={e => fieldChange("password", e.target.value)} placeholder={signup ? "Create a password" : "Enter your password"} required disabled={busy} aria-invalid={!!issues.password} aria-describedby={issues.password ? "auth-password-error" : signup ? "auth-password-hint" : undefined} />
                  <button className="auth-password-toggle" type="button" disabled={busy} onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>{showPassword ? "Hide" : "Show"}</button>
                </div>
                {issues.password ? <p className="auth-field-error" id="auth-password-error">{issues.password}</p> : signup && <p className="auth-field-hint" id="auth-password-hint">Use at least 8 characters.</p>}
              </div>}
              {error && <p className="auth-notice auth-notice-error" role="alert">{error}</p>}
              {signup && <p className="auth-consent">By creating an account, you confirm you're 18+ and agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.</p>}
              <button className="auth-primary" type="submit" disabled={busy}>
                {busy ? (reset ? "Sending reset link…" : signup ? "Creating your account…" : "Signing you in…") : (reset ? "Send reset link" : signup ? "Create account" : "Sign in")}
                {!busy && <span aria-hidden="true">→</span>}
              </button>
            </form>
            <p className="auth-switch">{reset ? "Remember your password?" : signup ? "Already part of the crew?" : "New to Baddie?"}{" "}
              <button className="auth-link" type="button" disabled={busy} onClick={() => changeMode(signup || reset ? "login" : "signup")}>{signup || reset ? "Sign in" : "Create an account"}</button>
            </p>
          </>}
          <footer className="auth-footer"><a href="/privacy">Privacy</a><span aria-hidden="true">·</span><a href="/terms">Terms</a><span className="auth-footer-note">Made for going places.</span></footer>
        </div>
      </main>
    </div>
  </div>;
}
