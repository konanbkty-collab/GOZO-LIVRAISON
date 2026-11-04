/**
 * Identité GOZO LIVRAISON inspirée de l'affiche fournie :
 * lettres GOZO bleu/jaune, livreur à moto, colis, bandeau LIVRAISON
 * et mention GAGNOA. Le tracé reste vectoriel et net à toute taille.
 */

type IconProps = { className?: string; title?: string };

/** Illustration compacte : moto, livreur, colis et arc bleu/jaune. */
export function LogoIcon({ className = "h-12 w-12", title = "GOZO Livraison" }: IconProps) {
  return (
    <svg viewBox="0 0 180 150" className={className} role="img" aria-label={title}>
      <title>{title}</title>
      <defs>
        <linearGradient id="gozo-yellow-scooter" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ffdc35" />
          <stop offset="1" stopColor="#ffb800" />
        </linearGradient>
      </defs>
      {/* Grand arc du logo original */}
      <path d="M20 112 A76 76 0 0 1 153 40" fill="none" stroke="#14448c" strokeWidth="13" strokeLinecap="round" />
      <path d="M51 51 A72 72 0 0 1 161 74" fill="none" stroke="#ffc72c" strokeWidth="12" strokeLinecap="round" />
      {/* Traits de vitesse */}
      <path d="M4 93h32M0 108h25M12 123h28" stroke="#14448c" strokeWidth="4" strokeLinecap="round" />
      {/* Colis jaune sur le porte-bagage */}
      <path d="M38 67q0-5 6-5h32q6 0 6 6v32q0 6-6 6H44q-6 0-6-6z" fill="url(#gozo-yellow-scooter)" stroke="#14448c" strokeWidth="4" />
      <path d="M60 63v42M40 79h40" fill="none" stroke="#14448c" strokeWidth="2.5" />
      <path d="M60 63l20 16M60 63L40 79" fill="none" stroke="#ffffff" strokeWidth="2.2" />
      {/* Roues */}
      <circle cx="67" cy="124" r="17" fill="#103568" />
      <circle cx="67" cy="124" r="7" fill="#fff" stroke="#ffc72c" strokeWidth="3" />
      <circle cx="146" cy="124" r="17" fill="#103568" />
      <circle cx="146" cy="124" r="7" fill="#fff" stroke="#ffc72c" strokeWidth="3" />
      {/* Cadre et carrosserie de scooter */}
      <path d="M67 124l24-25 33 4 22 21M91 99l-7 25h42" fill="none" stroke="#14448c" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M80 106q6-19 28-22l20 7q6 3 5 10l-3 8H88z" fill="url(#gozo-yellow-scooter)" stroke="#14448c" strokeWidth="4" />
      <path d="M131 91q12-6 20 0l8 13-17 3" fill="#ffffff" stroke="#14448c" strokeWidth="4" strokeLinejoin="round" />
      <path d="M153 91l7-11" stroke="#14448c" strokeWidth="4" strokeLinecap="round" />
      {/* Livreur : jambes, veste jaune et bras au guidon */}
      <path d="M95 74l24 7 12 20-13 9-15-15-15 9-11-7z" fill="#103568" stroke="#ffffff" strokeWidth="2" />
      <path d="M89 50q4-10 16-9l12 8 12 21-15 11-18-8-12 4-9-10 7-16z" fill="url(#gozo-yellow-scooter)" stroke="#14448c" strokeWidth="4" strokeLinejoin="round" />
      <path d="M108 65l23 23" fill="none" stroke="#14448c" strokeWidth="7" strokeLinecap="round" />
      <circle cx="134" cy="88" r="5" fill="#103568" />
      {/* Casque */}
      <path d="M93 40q0-23 22-25 24 2 22 26l-7 9-28-2z" fill="#14448c" stroke="#ffffff" strokeWidth="3" />
      <path d="M116 21q15 2 18 15l-18-2q-5-1-6-6z" fill="#f8fbff" />
      <path d="M98 45q12 4 31 4" stroke="#ffc72c" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

type LogoProps = IconProps & { withCity?: boolean };

/** Logo principal, reprenant la composition et les couleurs de l'affiche. */
export function Logo({ className = "h-20", withCity = true, title = "GOZO Livraison Gagnoa" }: LogoProps) {
  return (
    <svg viewBox="0 0 820 430" className={className} role="img" aria-label={title}>
      <title>{title}</title>
      <defs>
        <linearGradient id="gozo-logo-yellow" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ffd82d" />
          <stop offset="1" stopColor="#ffb900" />
        </linearGradient>
        <linearGradient id="gozo-logo-blue" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#0b4c98" />
          <stop offset="1" stopColor="#082d61" />
        </linearGradient>
        <filter id="gozo-logo-shadow" x="-10%" y="-20%" width="120%" height="150%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#082d61" floodOpacity="0.14" />
        </filter>
      </defs>

      {/* Illustration du mot-symbole : grand arc et coursier à moto */}
      <g transform="translate(235 0) scale(1.55)">
        <path d="M20 112 A76 76 0 0 1 153 40" fill="none" stroke="#14448c" strokeWidth="12" strokeLinecap="round" />
        <path d="M51 51 A72 72 0 0 1 161 74" fill="none" stroke="#ffc72c" strokeWidth="12" strokeLinecap="round" />
        <path d="M0 93h34M4 108h25M12 123h28" stroke="#14448c" strokeWidth="4" strokeLinecap="round" />
        <path d="M38 67q0-5 6-5h32q6 0 6 6v32q0 6-6 6H44q-6 0-6-6z" fill="url(#gozo-logo-yellow)" stroke="#14448c" strokeWidth="4" />
        <path d="M60 63v42M40 79h40" fill="none" stroke="#14448c" strokeWidth="2.5" />
        <path d="M60 63l20 16M60 63L40 79" fill="none" stroke="#fff" strokeWidth="2.2" />
        <circle cx="67" cy="124" r="17" fill="#103568" />
        <circle cx="67" cy="124" r="7" fill="#fff" stroke="#ffc72c" strokeWidth="3" />
        <circle cx="146" cy="124" r="17" fill="#103568" />
        <circle cx="146" cy="124" r="7" fill="#fff" stroke="#ffc72c" strokeWidth="3" />
        <path d="M67 124l24-25 33 4 22 21M91 99l-7 25h42" fill="none" stroke="#14448c" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M80 106q6-19 28-22l20 7q6 3 5 10l-3 8H88z" fill="url(#gozo-logo-yellow)" stroke="#14448c" strokeWidth="4" />
        <path d="M131 91q12-6 20 0l8 13-17 3" fill="#fff" stroke="#14448c" strokeWidth="4" strokeLinejoin="round" />
        <path d="M153 91l7-11" stroke="#14448c" strokeWidth="4" strokeLinecap="round" />
        <path d="M95 74l24 7 12 20-13 9-15-15-15 9-11-7z" fill="#103568" stroke="#fff" strokeWidth="2" />
        <path d="M89 50q4-10 16-9l12 8 12 21-15 11-18-8-12 4-9-10 7-16z" fill="url(#gozo-logo-yellow)" stroke="#14448c" strokeWidth="4" strokeLinejoin="round" />
        <path d="M108 65l23 23" fill="none" stroke="#14448c" strokeWidth="7" strokeLinecap="round" />
        <circle cx="134" cy="88" r="5" fill="#103568" />
        <path d="M93 40q0-23 22-25 24 2 22 26l-7 9-28-2z" fill="#14448c" stroke="#fff" strokeWidth="3" />
        <path d="M116 21q15 2 18 15l-18-2q-5-1-6-6z" fill="#f8fbff" />
        <path d="M98 45q12 4 31 4" stroke="#ffc72c" strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* Cartouche blanc à contour bleu : clin d'œil au lettrage de l'affiche */}
      <path d="M40 177q0-18 20-18h700q21 0 21 20v77q0 20-21 20H61q-21 0-21-19z" fill="#fff" stroke="#14448c" strokeWidth="8" filter="url(#gozo-logo-shadow)" />
      <text x="410" y="252" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontSize="129" fontWeight="1000" fontStyle="italic" letterSpacing="1" paintOrder="stroke fill" stroke="#fff" strokeWidth="12">
        <tspan fill="#14448c">G</tspan><tspan fill="url(#gozo-logo-yellow)">O</tspan><tspan fill="#14448c">Z</tspan><tspan fill="url(#gozo-logo-yellow)">O</tspan>
      </text>

      {/* Bandeau LIVRAISON */}
      <rect x="83" y="284" width="654" height="66" rx="22" fill="url(#gozo-logo-blue)" stroke="#fff" strokeWidth="5" />
      <rect x="83" y="284" width="13" height="66" rx="6.5" fill="#ffc72c" />
      <text x="397" y="330" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="41" fontWeight="900" fontStyle="italic" letterSpacing="8" fill="#fff">LIVRAISON</text>

      {/* Petit colis stylisé à droite du bandeau */}
      <g transform="translate(724 292)">
        <path d="M0 13l34-14 32 14v37L33 67 0 50z" fill="url(#gozo-logo-yellow)" stroke="#14448c" strokeWidth="4" strokeLinejoin="round" />
        <path d="M33-1v68M0 13l33 16 33-16M19 6l34 16" fill="none" stroke="#fff" strokeWidth="4" />
        <path d="M33 29L0 13v37l33 17z" fill="#ffc72c" opacity="0.9" />
        <path d="M33 29l33-16v37L33 67z" fill="#147f88" opacity="0.9" />
      </g>

      {/* GAGNOA, sous le ruban */}
      {withCity && (
        <g>
          <path d="M210 385h60M550 385h60" stroke="#ffc72c" strokeWidth="6" strokeLinecap="round" />
          <text x="410" y="397" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="37" fontWeight="900" letterSpacing="12" fill="#12858a">GAGNOA</text>
        </g>
      )}
    </svg>
  );
}

/** Logo horizontal compact pour les barres de navigation. */
export function LogoCompact({ className = "h-9", title = "GOZO Livraison" }: IconProps) {
  return (
    <svg viewBox="0 0 400 105" className={className} role="img" aria-label={title}>
      <title>{title}</title>
      <g transform="translate(0 2) scale(.62)">
        <path d="M20 112 A76 76 0 0 1 153 40" fill="none" stroke="#14448c" strokeWidth="13" strokeLinecap="round" />
        <path d="M51 51 A72 72 0 0 1 161 74" fill="none" stroke="#ffc72c" strokeWidth="12" strokeLinecap="round" />
        <path d="M4 93h32M0 108h25M12 123h28" stroke="#14448c" strokeWidth="4" strokeLinecap="round" />
        <path d="M38 67q0-5 6-5h32q6 0 6 6v32q0 6-6 6H44q-6 0-6-6z" fill="#ffc72c" stroke="#14448c" strokeWidth="4" />
        <path d="M60 63v42M40 79h40" fill="none" stroke="#14448c" strokeWidth="2.5" />
        <circle cx="67" cy="124" r="17" fill="#103568" /><circle cx="67" cy="124" r="7" fill="#fff" stroke="#ffc72c" strokeWidth="3" />
        <circle cx="146" cy="124" r="17" fill="#103568" /><circle cx="146" cy="124" r="7" fill="#fff" stroke="#ffc72c" strokeWidth="3" />
        <path d="M67 124l24-25 33 4 22 21M91 99l-7 25h42" fill="none" stroke="#14448c" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M80 106q6-19 28-22l20 7q6 3 5 10l-3 8H88z" fill="#ffc72c" stroke="#14448c" strokeWidth="4" />
        <path d="M95 74l24 7 12 20-13 9-15-15-15 9-11-7z" fill="#103568" stroke="#fff" strokeWidth="2" />
        <path d="M89 50q4-10 16-9l12 8 12 21-15 11-18-8-12 4-9-10 7-16z" fill="#ffc72c" stroke="#14448c" strokeWidth="4" />
        <path d="M93 40q0-23 22-25 24 2 22 26l-7 9-28-2z" fill="#14448c" stroke="#fff" strokeWidth="3" />
        <path d="M116 21q15 2 18 15l-18-2q-5-1-6-6z" fill="#fff" />
      </g>
      <text x="110" y="52" fontFamily="Arial Black, Arial, sans-serif" fontSize="48" fontWeight="1000" fontStyle="italic" letterSpacing="0">
        <tspan fill="#14448c">G</tspan><tspan fill="#ffc72c">O</tspan><tspan fill="#14448c">Z</tspan><tspan fill="#ffc72c">O</tspan>
      </text>
      <rect x="110" y="59" width="235" height="30" rx="11" fill="#14448c" />
      <text x="225" y="81" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="17" fontWeight="900" fontStyle="italic" letterSpacing="4" fill="#fff">LIVRAISON</text>
      <text x="352" y="79" fontFamily="Arial Black, Arial, sans-serif" fontSize="13" fontWeight="900" fill="#12858a">GN</text>
    </svg>
  );
}
