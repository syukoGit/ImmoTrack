'use client';

import type { SubmitEvent } from 'react';
import { useState } from 'react';

export interface AgentIngestFormProps {
  readonly endpoint: string;
  readonly examplePayload: string;
}

interface Submission {
  readonly status: number;
  readonly body: string;
}

/**
 * Page technique de test du contrat : envoie le JSON tel quel à l'API d'ingestion avec le jeton
 * saisi. Le jeton n'est ni stocké ni journalisé côté navigateur.
 */
export function AgentIngestForm({ endpoint, examplePayload }: AgentIngestFormProps) {
  const [payload, setPayload] = useState(examplePayload);
  const [token, setToken] = useState('');
  const [pending, setPending] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setFailure(null);
    setSubmission(null);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: payload,
      });
      const text = await response.text();
      setSubmission({ status: response.status, body: prettify(text) });
    } catch {
      setFailure('La requête n’a pas pu être envoyée.');
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="stack" onSubmit={(event) => void submit(event)}>
      <label>
        Jeton agent
        <input
          type="password"
          autoComplete="off"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          required
        />
      </label>
      <label>
        Payload JSON (schemaVersion 1.0)
        <textarea
          rows={18}
          spellCheck={false}
          value={payload}
          onChange={(event) => setPayload(event.target.value)}
        />
      </label>
      <button type="submit" disabled={pending}>
        {pending ? 'Envoi…' : 'Envoyer le lot'}
      </button>
      {failure !== null && (
        <p role="alert" className="error">
          {failure}
        </p>
      )}
      {submission !== null && (
        <section aria-live="polite">
          <h2>Accusé de réception — HTTP {submission.status}</h2>
          <pre>{submission.body}</pre>
        </section>
      )}
    </form>
  );
}

const prettify = (text: string): string => {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
};
