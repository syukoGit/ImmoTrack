// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AgentIngestForm } from './AgentIngestForm';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AgentIngestForm', () => {
  it('posts the payload with the bearer token and displays the acknowledgement', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'accepted', ingestionRequestId: 'req-1' }), {
        status: 202,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<AgentIngestForm endpoint="/api/v1/agent-ingestion" examplePayload='{"a":1}' />);

    await user.type(screen.getByLabelText('Jeton agent'), 'secret-token');
    await user.click(screen.getByRole('button', { name: 'Envoyer le lot' }));

    expect(await screen.findByText('Accusé de réception — HTTP 202')).toBeInTheDocument();
    expect(screen.getByText(/"ingestionRequestId": "req-1"/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/agent-ingestion', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer secret-token' },
      body: '{"a":1}',
    });
  });

  it('reports a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    const user = userEvent.setup();
    render(<AgentIngestForm endpoint="/api" examplePayload="{}" />);

    await user.type(screen.getByLabelText('Jeton agent'), 't');
    await user.click(screen.getByRole('button', { name: 'Envoyer le lot' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La requête n’a pas pu être envoyée.',
    );
  });
});
