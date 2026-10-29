import React, { useState } from 'react';
import { Building, Calculator, ChevronRight, MapPin, ShieldCheck } from 'lucide-react';

interface HeroSectionProps {
  onOpenSimulator: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenSimulator }) => {
  const [heroTilt, setHeroTilt] = useState({ x: 0, y: 0 });

  const handleHeroPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const relativeY = (event.clientY - bounds.top) / bounds.height - 0.5;
    setHeroTilt({ x: relativeY * -3, y: relativeX * 3 });
  };

  return (
    <section 
      id="hero" 
      className="relative pt-14 pb-12 sm:pt-16 sm:pb-14 lg:pt-20 lg:pb-16 flex items-center bg-[#FAFAFA] overflow-hidden border-b border-neutral-200/70"
    >
      {/* Subtle architectural background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#E5E7EB_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          
          {/* Left Column: Editorial Value Proposition & CTAs */}
          <div className="lg:col-span-6 space-y-5 sm:space-y-6 text-left">
            
            <div className="space-y-3">
              <p className="text-xs sm:text-sm font-bold tracking-[0.16em] text-[#9a4a28] uppercase">
                RÉSIDENCE NOEMA • ANGRÉ DJOROGOBITÉ, ABIDJAN
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-extrabold tracking-tight text-neutral-900 leading-[1.08]">
                Découvrez la <span className="text-[#9a4a28]">Résidence NOEMA,</span> votre prochain investissement à Abidjan.
              </h2>
            </div>

            <p className="text-base sm:text-lg text-neutral-600 font-normal leading-relaxed max-w-xl">
              Une résidence de standing pensée pour investir, <strong className="font-bold text-neutral-800">préparer votre retour,</strong> disposer de votre pied-à-terre à Abidjan et générer des revenus locatifs.
            </p>

            <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <li className="flex items-start gap-2.5 text-sm text-neutral-800">
                <Building className="mt-0.5 h-4 w-4 shrink-0 text-[#9a4a28]" />
                <span><strong>Appartements T2 &amp; T3</strong><span className="block text-xs text-neutral-500">Surfaces optimisées</span></span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-neutral-800">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#9a4a28]" />
                <span><strong>Emplacement premium</strong><span className="block text-xs text-neutral-500">Cocody Angré</span></span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-neutral-800">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#9a4a28]" />
                <span><strong>Financement possible</strong><span className="block text-xs text-neutral-500">Avec nos partenaires</span></span>
              </li>
            </ul>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <button
                id="hero-cta-simulator"
                onClick={onOpenSimulator}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-neutral-900 text-white text-sm font-bold tracking-wide hover:bg-neutral-800 hover:shadow-lg transition-all duration-200 active:scale-98 group"
              >
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span>SIMULER MON FINANCEMENT</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                id="hero-cta-apartments"
                href="#appartements"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-white text-neutral-900 border border-neutral-300 text-sm font-bold tracking-wide hover:bg-neutral-50 hover:border-neutral-400 hover:shadow-md transition-all duration-200 active:scale-98"
              >
                <span>DÉCOUVRIR LES APPARTEMENTS</span>
              </a>
            </div>

            <div className="pt-6 border-t border-neutral-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <span className="text-xs text-neutral-600 font-medium">Bâtiment</span>
                <span className="text-sm font-bold text-neutral-900">R+7 Standing</span>
                <span className="mt-1 text-xs leading-snug text-neutral-500">Architecture contemporaine</span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-neutral-600 font-medium">Typologies</span>
                <span className="text-sm font-bold text-neutral-900">T2 &amp; T3</span>
                <span className="mt-1 text-xs leading-snug text-neutral-500">Espaces fonctionnels</span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-neutral-600 font-medium">Livraison prévisionnelle</span>
                <span className="text-sm font-bold text-neutral-900">Janvier 2029</span>
                <span className="mt-1 text-xs leading-snug text-neutral-500">Construction en cours</span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-neutral-600 font-medium">Accompagnement</span>
                <span className="text-sm font-bold text-neutral-900">ImmoDiaspo</span>
                <span className="mt-1 text-xs leading-snug text-neutral-500">De A à Z</span>
              </div>
            </div>

          </div>

          {/* Right Column: Architectural Hero Image with Frame & Parallax Effect */}
          <div className="relative lg:col-span-6" onPointerMove={handleHeroPointerMove} onPointerLeave={() => setHeroTilt({ x: 0, y: 0 })}>
            <div className="relative mx-auto max-w-md lg:max-w-none group">
              
              {/* Outer Glow & Architectural White Framing */}
              <div className="relative rounded-2xl bg-white p-3 sm:p-4 shadow-xl border border-neutral-200/90 transition-all duration-500 group-hover:shadow-2xl" style={{ transform: `perspective(1200px) rotateX(${heroTilt.x}deg) rotateY(${heroTilt.y}deg)`, transformStyle: 'preserve-3d' }}>
                
                <div className="relative rounded-xl overflow-hidden bg-neutral-100 aspect-[5/4]">
                  <img
                    id="hero-facade-image"
                    src="./images/noema-facade.webp"
                    alt="Façade de la Résidence NOEMA à Angré Djorogobité, Abidjan"
                    referrerPolicy="no-referrer"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="w-full h-full object-cover object-center transform group-hover:scale-103 transition-transform duration-700 ease-out"
                  />
                </div>

                <div className="absolute bottom-5 left-5 rounded-xl border border-white/60 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-sm">
                  <p className="text-xs font-bold text-neutral-900">Cocody Angré</p>
                  <p className="mt-0.5 text-[10px] text-neutral-600">Abidjan, Côte d'Ivoire</p>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
