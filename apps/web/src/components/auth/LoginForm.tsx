'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import type { SubmitEvent } from 'react';
import { useState } from 'react';

export interface LoginFormProps {
  readonly supabaseUrl: string;
  /** Clé publiable Supabase : conçue pour le navigateur (jamais la clé service_role). */
  readonly publishableKey: string;
}

export function LoginForm({ supabaseUrl, publishableKey }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setFailed(false);
    const supabase = createBrowserClient(supabaseUrl, publishableKey);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (error !== null) {
      // Message volontairement générique : ne révèle pas si le compte existe.
      setFailed(true);
      return;
    }
    router.replace('/');
    router.refresh();
  };

  return (
    <form className="stack" onSubmit={(event) => void submit(event)}>
      <label>
        Email
        <input
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label>
        Mot de passe
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      <button type="submit" disabled={pending}>
        {pending ? 'Connexion…' : 'Se connecter'}
      </button>
      {failed && (
        <p role="alert" className="error">
          Identifiants invalides.
        </p>
      )}
    </form>
  );
}
