import React from 'react';
import { Building, MapPin, Phone, Mail, MessageCircle, ShieldCheck, ArrowUp, ArrowRight, Sparkles } from 'lucide-react';
import { ResidenceInfo } from '../types';
import { buildWhatsAppURL } from '../utils/utm';

interface FooterProps {
  residence?: ResidenceInfo;
  onToggleUrielGroup: () => void;
  onOpenSimulator: () => void;
  onOpenVisioAppointment: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  residence,
  onToggleUrielGroup,
  onOpenSimulator,
  onOpenVisioAppointment
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const whatsappNumber = residence?.whatsapp_number || '+377678630862';
  const emailContact = residence?.email_contact || 'finance@urielgroup.fr';
  const whatsappUrl = buildWhatsAppURL(
    whatsappNumber,
    'Bonjour, je souhaite entrer en contact avec la direction commerciale de la Résidence NOEMA.'
  );

  return (
    <footer id="main-footer" className="border-t border-[#e5c9b1] bg-[#fdfaf4] text-neutral-700 text-xs">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">

        <div className="relative mb-10 grid overflow-hidden rounded-2xl border border-white/70 bg-[#fffdf9] text-neutral-900 shadow-[0_16px_44px_rgba(91,58,46,0.1)] lg:grid-cols-[0.85fr_1.15fr]">
          <div className="relative min-h-[190px] overflow-hidden sm:min-h-[230px]">
            <img
              src="./images/image footer.jpeg"
              alt="Un couple reçoit les clés de son logement"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#d15a3a] backdrop-blur-sm sm:left-8 sm:top-8">
              Un projet de confiance
            </div>
          </div>

          <div className="flex flex-col justify-center bg-[#fffdf9] px-6 py-6 sm:px-8 sm:py-7">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#d15a3a]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Un financement bancaire à 100 %</span>
              </div>
              <h2 className="max-w-2xl font-serif text-2xl font-bold leading-tight sm:text-3xl">La Résidence NOEMA est déjà financée à 100 % par la banque</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-neutral-600">Ce financement témoigne de la confiance accordée au projet par ses partenaires bancaires.</p>
            </div>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4 text-[11px] font-semibold text-neutral-700">
                <span><strong className="mr-1 text-[#d15a3a]">T2</strong> &amp; <strong className="ml-1 text-[#d15a3a]">T3</strong></span>
                <span className="h-1 w-1 rounded-full bg-[#dc8366]" />
                <span>Angré, Abidjan</span>
              </div>
              <button
                onClick={onOpenVisioAppointment}
                className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-[#dc8366] px-5 py-3 text-xs font-bold text-white shadow-md shadow-[#dc8366]/20 transition-all hover:bg-[#dc6044] hover:shadow-lg active:scale-95 sm:self-auto"
              >
                Échanger avec un conseiller
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <section aria-labelledby="footer-partners-title" className="mb-12 border-b border-[#5b3a2e]/15 pb-10">
          <h2 id="footer-partners-title" className="mb-6 text-center font-serif text-sm font-bold uppercase tracking-wider text-neutral-900">
            Nos partenaires
          </h2>
          <div className="grid grid-cols-2 items-center gap-6 sm:grid-cols-4">
            <img src="./images/partenaire%20(1).jpeg" alt="APAVE" loading="lazy" decoding="async" className="mx-auto h-16 w-full max-w-48 object-contain" />
            <img src="./images/partenaire%20(1).png" alt="OpenBoxci Design, architectes" loading="lazy" decoding="async" className="mx-auto h-16 w-full max-w-48 object-contain" />
            <img src="./images/partenaire%20(2).jpeg" alt="AGTS" loading="lazy" decoding="async" className="mx-auto h-16 w-full max-w-48 object-contain" />
            <img src="./images/partenaire%20(2).png" alt="Cabinet Archi Mage" loading="lazy" decoding="async" className="mx-auto h-16 w-full max-w-48 object-contain" />
          </div>
        </section>
        
        <div className="grid grid-cols-1 gap-10 border-b border-[#5b3a2e]/15 pb-12 md:grid-cols-2 lg:grid-cols-12">
          
          {/* Promoter Col */}
          <div className="lg:col-span-4 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#c48f5f]/50 bg-black p-1 shadow-lg shadow-[#5b3a2e]/20">
                <img src="./images/LOGO%20DU%20PROMOTTEUR.jpg" alt="Logo de Méniger-Bamba Construction et Immobilier, promoteur de la Résidence NOEMA" className="h-full w-full object-contain" />
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#d15a3a]">Le promoteur</span>
                <span className="mt-1 block font-serif text-lg font-bold leading-tight text-neutral-900">Méniger-Bamba</span>
                <span className="block text-[11px] text-neutral-600">Construction et Immobilier</span>
              </div>
            </div>

            <p className="max-w-sm leading-relaxed text-neutral-600">
              Méniger-Bamba Construction et Immobilier est le promoteur de la Résidence NOEMA, un programme résidentiel R+7 à Angré Djorogobité, Abidjan.
            </p>

            <div className="flex items-center gap-3 pt-2 text-[11px] text-neutral-500">
              <span>Partenaire promoteur : <strong>Uriel Group</strong></span>
              <span>•</span>
              <span>Distribution : <strong>ImmoDiaspo</strong></span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3 space-y-3 text-left">
            <h4 className="border-l-2 border-[#d15a3a] pl-3 font-serif text-sm font-bold uppercase tracking-wider text-neutral-900">Navigation</h4>
            <ul className="space-y-2 text-neutral-600">
              <li><a href="#decouvrir" className="transition-colors hover:text-[#d15a3a]">Découvrir le programme</a></li>
              <li><a href="#appartements" className="transition-colors hover:text-[#d15a3a]">Appartements & Prix</a></li>
              <li><a href="#simulateur" onClick={onOpenSimulator} className="font-semibold text-[#d15a3a] transition-colors hover:text-[#5b3a2e]">Simulateur de Financement</a></li>
              <li><a href="#chantier" className="transition-colors hover:text-[#d15a3a]">Avancement du Chantier</a></li>
              <li><a href="#pourquoi-investir" className="transition-colors hover:text-[#d15a3a]">Pourquoi Investir ?</a></li>
              <li><a href="#localisation" className="transition-colors hover:text-[#d15a3a]">Localisation à Angré Djorogobité</a></li>
              <li><a href="#faq" className="transition-colors hover:text-[#d15a3a]">Questions fréquentes (FAQ)</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="lg:col-span-3 space-y-3 text-left">
            <h4 className="border-l-2 border-[#d15a3a] pl-3 font-serif text-sm font-bold uppercase tracking-wider text-neutral-900">Contact & Bureau de Vente</h4>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#d15a3a] shrink-0 mt-0.5" />
                <span>Angré Djorogobité, Cocody — Abidjan, Côte d'Ivoire</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#d15a3a] shrink-0" />
                <a href="tel:+377678630862" className="hover:text-[#d15a3a] hover:underline">+377 6 78 63 08 62</a>
              </div>
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-[#d15a3a] shrink-0" />
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-[#d15a3a] hover:underline">
                  WhatsApp Commercial : {whatsappNumber}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#d15a3a] shrink-0" />
                <a href={`mailto:${emailContact}`} className="hover:text-[#d15a3a] hover:underline">{emailContact}</a>
              </div>
            </div>
          </div>

          {/* Transition & Legal Column */}
          <div className="lg:col-span-2 space-y-4 text-left">
            <h4 className="border-l-2 border-[#d15a3a] pl-3 font-serif text-sm font-bold uppercase tracking-wider text-neutral-900">Groupe</h4>
            <button
              onClick={onToggleUrielGroup}
              className="group relative w-full overflow-hidden rounded-xl border border-[#5b3a2e]/20 bg-[#f7efe2] px-4 py-3 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d15a3a] hover:bg-[#d15a3a] hover:text-white hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#d15a3a]"
            >
              <span className="absolute inset-0 -left-full h-full w-1/2 skew-x-[-24deg] bg-white/15 transition-all duration-700 group-hover:left-full" />
              <span className="block font-semibold text-sm text-[#5b3a2e] transition-colors duration-300 group-hover:text-white">Uriel Group</span>
              <span className="block text-[10px] uppercase tracking-wide text-neutral-500 transition-colors duration-300 group-hover:text-white/80">Page de transition institutionnelle</span>
            </button>

            <div className="space-y-1 text-[11px] text-neutral-500">
              <p>Livraison : {residence?.delivery_date_estimated || 'janvier 2029'}</p>
              <p>Régime : VEFA notariée</p>
            </div>
          </div>

        </div>

        {/* Bottom Bar & Copyright */}
        <div className="flex flex-col items-center justify-between gap-4 pt-8 sm:flex-row">
          <p className="text-[11px] text-neutral-500">
            © {new Date().getFullYear()} Résidence NOEMA — Tous droits réservés. Développé par Uriel Group & ImmoDiaspo.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-neutral-500">
            <a href="/politique-de-confidentialite/" className="hover:text-[#d15a3a] hover:underline">Politique de Confidentialité</a>
            <span>•</span>
            <a href="/mentions-legales/" className="hover:text-[#d15a3a] hover:underline">Mentions légales</a>
            <span>•</span>
            <button type="button" onClick={() => window.dispatchEvent(new Event('noema-open-cookie-preferences'))} className="hover:text-[#d15a3a] hover:underline">Gérer mes cookies</button>
            <button
              onClick={scrollToTop}
              className="rounded-lg border border-white/10 bg-white/5 p-2 text-neutral-400 transition-colors hover:bg-[#d15a3a] hover:text-white"
              aria-label="Retour en haut"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
