import React from 'react';
import { ArrowRight, Check, ShieldCheck, TrendingUp } from 'lucide-react';
import { publicAssetUrl } from '../utils/publicAssetUrl';

const ELIGIBILITY_URL = 'https://immodiaspoinvest.urielgroup.fr/';
const INTRO_VIDEO_URL = publicAssetUrl('/images/PUBLICITE%2002-preview.mp4');
const INTRO_VIDEO_PREVIEW_IMAGE_URL = ''; // TODO: Add the video preview image URL.

const benefits = [
  { icon: ShieldCheck, title: 'Solutions de financement', detail: 'adaptées à la diaspora' },
  { icon: Check, title: 'Accompagnement de A à Z' },
  { icon: TrendingUp, title: 'Un investissement locatif durable', detail: "en Côte d'Ivoire" },
];

export const DiasporaFundingIntroSection: React.FC = () => (
  <section id="votre-projet" className="relative overflow-hidden border-b border-neutral-200/70 bg-[#FAFAFA] pb-14 pt-24 sm:pb-16 sm:pt-24 lg:pb-20 lg:pt-24">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#E5E7EB_1px,transparent_1px)] opacity-30 [background-size:24px_24px]" />

    <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8">
      <div className="space-y-6 lg:col-span-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a4a28] sm:text-sm">
          IMMO DIASPO • SOLUTION DE FINANCEMENT
        </p>

        <div className="space-y-3">
          <h1 className="font-serif text-4xl font-extrabold leading-[1.08] tracking-tight text-neutral-900 sm:text-5xl lg:text-[3.5rem]">
            Devenir propriétaire à Abidjan, où que vous soyez.
          </h1>
          <p className="font-serif text-xl font-bold text-[#9a4a28] sm:text-2xl">C'est maintenant possible !</p>
        </div>

        <div className="max-w-2xl space-y-3 text-base leading-relaxed text-neutral-600 sm:text-lg">
          <p>Vous vivez à l'étranger et souhaitez investir dans l'immobilier locatif en Côte d'Ivoire ?</p>
          <p>
            Avec IMMO DIASPO, Uriel Group vous accompagne dans la recherche de solutions de financement adaptées à votre
            profil pour concrétiser votre projet immobilier à Abidjan, même à distance.
          </p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {benefits.map(({ icon: Icon, title, detail }) => (
            <li key={title} className="flex items-start gap-2.5 text-sm text-neutral-800">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#9a4a28]/10 text-[#9a4a28]">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="leading-snug">
                <span className="font-bold">{title}</span>
                {detail && <span className="block text-xs text-neutral-500">({detail})</span>}
              </span>
            </li>
          ))}
        </ul>

        <div className="space-y-3 pt-1">
          <a
            href={ELIGIBILITY_URL}
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-neutral-900 px-6 py-4 text-sm font-bold tracking-wide text-white transition-colors hover:bg-neutral-800 sm:w-auto"
          >
            <span>VÉRIFIER VOTRE ÉLIGIBILITÉ AU FINANCEMENT IMMODIASPO</span>
            <ArrowRight className="h-4 w-4 text-[#d15a3a]" />
          </a>
          <p className="max-w-lg text-xs leading-relaxed text-neutral-500">
            Répondez à quelques questions pour savoir si vous pouvez bénéficier d'une solution de financement.
          </p>
        </div>
      </div>

      <div className="lg:col-span-6">
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-xl shadow-neutral-900/10 sm:p-4">
          <h2 className="px-1 pb-3 font-serif text-lg font-bold leading-snug text-neutral-900 sm:px-2 sm:pb-4 sm:text-xl">
            Comment financer votre investissement immobilier à Abidjan depuis l'étranger ?
          </h2>
          <div className="relative aspect-video overflow-hidden rounded-xl bg-[#5b3a2e]">
            <video
              className="h-full w-full object-cover"
              controls
              autoPlay
              muted
              playsInline
              preload="metadata"
              poster={INTRO_VIDEO_PREVIEW_IMAGE_URL || undefined}
              aria-label="Présentation du financement immobilier à Abidjan"
            >
              <source src={INTRO_VIDEO_URL} type="video/mp4" />
              Votre navigateur ne prend pas en charge la lecture vidéo.
            </video>
          </div>
        </div>
      </div>
    </div>
  </section>
);
