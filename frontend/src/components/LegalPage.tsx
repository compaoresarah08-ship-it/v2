import React from 'react';
import { PrivacyContent, LegalContent, CookieContent } from './LegalContent';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

type LegalPageKind = 'privacy' | 'legal' | 'cookies';
const pageContent: Record<LegalPageKind, { title: string; intro: string }> = {
  privacy: { title: 'Politique de confidentialité', intro: 'Cette politique décrit les données traitées lorsque vous utilisez le site de la Résidence NOEMA et ses formulaires.' },
  legal: { title: 'Mentions légales', intro: 'Informations sur l’éditeur et l’hébergement du site de la Résidence NOEMA.' },
  cookies: { title: 'Politique des cookies', intro: 'Le site privilégie une utilisation sans suivi publicitaire. Les technologies décrites ci-dessous sont limitées à celles réellement présentes dans le projet.' },
};

export const LegalPage: React.FC<{ kind: LegalPageKind }> = ({ kind }) => {
  const content = pageContent[kind];
  return <main className="min-h-screen bg-[#fbf8f2] text-[#5b3a2e]"><div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-14">
    <a href="/" className="mb-12 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#d15a3a] hover:underline"><ArrowLeft className="h-4 w-4" /> Retour au site</a>
    <div className="mb-12 border-b border-[#e5c9b1] pb-8"><div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#d15a3a]"><ShieldCheck className="h-4 w-4" /> Résidence NOEMA</div><h1 className="font-serif text-4xl font-bold leading-tight sm:text-6xl">{content.title}</h1><p className="mt-5 max-w-2xl text-base leading-relaxed text-neutral-600">{content.intro}</p><p className="mt-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">Dernière mise à jour : 4 octobre 2026</p></div>
    {kind === 'privacy' && <PrivacyContent />}{kind === 'legal' && <LegalContent />}{kind === 'cookies' && <CookieContent />}
  </div></main>;
};
