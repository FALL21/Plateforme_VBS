import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VBS - Vos Besoins Services',
  description: 'Plateforme de services au Sénégal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} pt-16`}>
        <Header />
        {children}
      </body>
    </html>
  );
}

