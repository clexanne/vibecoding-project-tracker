import { useState } from 'react';

const inputClass =
  'mt-1.5 min-h-11 w-full rounded-md border border-slate-500 bg-surface-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary';
const labelClass = 'block text-sm font-medium text-text-primary';

/**
 * Mock sign-in: shown instead of the board when nobody is signed in. There is
 * no real auth, so any non-empty email and password gets in. An email that
 * matches a teammate signs in as them; anything else, or the demo button,
 * signs in as the first teammate, so the header always has a real person to show.
 */
export default function SignIn({ team, onSignIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const firstMemberId = () => team[0]?.id ?? null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = {};
    if (!email.trim()) next.email = 'Enter your email.';
    if (!password) next.password = 'Enter your password.';
    setErrors(next);
    if (next.email || next.password) {
      // Send focus to the first empty field, so keyboard users land where the fix is.
      document.getElementById(next.email ? 'signin-email' : 'signin-password')?.focus();
      return;
    }
    const match = team.find((member) => member.email?.toLowerCase() === email.trim().toLowerCase());
    onSignIn(match?.id ?? firstMemberId());
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-page font-sans">
      <header className="flex items-center border-b border-slate-200 bg-surface-card px-4 py-3 sm:px-8">
        {/* Same logo and wordmark as the board's header, so the app reads as one place. */}
        <a
          href="/"
          className="inline-flex min-w-min items-center gap-3 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary forced-color-adjust-none">
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" aria-hidden="true">
              <rect x="3" y="4" width="5" height="4" rx="1" />
              <rect x="3" y="10" width="5" height="4" rx="1" />
              <rect x="3" y="16" width="5" height="4" rx="1" />
              <rect x="9.5" y="4" width="5" height="4" rx="1" />
              <rect x="9.5" y="10" width="5" height="4" rx="1" />
              <rect x="16" y="4" width="5" height="4" rx="1" />
            </svg>
          </span>
          <h1 className="text-lg font-bold leading-tight text-brand-primary sm:text-2xl">
            Vibecoding Project Tracker
            <span className="sr-only">, home</span>
          </h1>
        </a>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        {/* A plain white card with a thin border and no shadow, like the deliverable cards. */}
        <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-surface-card p-6">
          <h2 id="signin-heading" className="mb-5 text-xl font-semibold text-text-primary">Sign in</h2>

          {/* noValidate: our own plain errors replace the browser's bubbles, which
              disappear before slower readers finish them. */}
          <form onSubmit={handleSubmit} noValidate aria-labelledby="signin-heading" className="space-y-4">
            <div>
              <label htmlFor="signin-email" className={labelClass}>Email</label>
              <input
                id="signin-email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrors((current) => ({ ...current, email: undefined }));
                }}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'signin-email-error' : undefined}
                className={`${inputClass} ${errors.email ? 'border-due-overdue' : ''}`}
              />
              {errors.email && (
                <p id="signin-email-error" className="mt-1 text-sm text-due-overdue">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="signin-password" className={labelClass}>Password</label>
              <input
                id="signin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((current) => ({ ...current, password: undefined }));
                }}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'signin-password-error' : undefined}
                className={`${inputClass} ${errors.password ? 'border-due-overdue' : ''}`}
              />
              {errors.password && (
                <p id="signin-password-error" className="mt-1 text-sm text-due-overdue">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              className="min-h-11 w-full rounded-md border border-transparent bg-brand-primary px-4 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            >
              Sign in
            </button>
          </form>

          {/* Outside the form, so Enter in a field never picks it by mistake. */}
          <button
            type="button"
            onClick={() => onSignIn(firstMemberId())}
            className="mt-3 min-h-11 w-full rounded-md border border-slate-500 bg-surface-card px-4 text-sm font-medium text-text-primary hover:bg-brand-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            Continue as demo user
          </button>
        </div>
      </main>
    </div>
  );
}
