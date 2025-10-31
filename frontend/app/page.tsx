'use client';
import dynamic from 'next/dynamic';

// Rendre la page de recherche directement sur la page d'accueil
const RecherchePage = dynamic(() => import('./(public)/recherche/page'), { ssr: false });

export default function Home() {
  return <RecherchePage />;
}

