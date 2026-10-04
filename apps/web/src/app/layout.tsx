import './globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: { default: 'ImmoTrack', template: '%s · ImmoTrack' },
  description: "Suivi et analyse d'investissements immobiliers.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
