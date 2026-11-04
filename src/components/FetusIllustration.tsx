// Illustration originale et stylisée : un embryon (avant 10 SA) puis un fœtus recroquevillé,
// dont la taille dans le cercle suit (en échelle logarithmique) sa taille réelle.

export function FetusIllustration({ sa, sizeCm, className = "" }: { sa: number; sizeCm: number; className?: string }) {
  const scale = 0.28 + 0.72 * (Math.log(sizeCm + 1) / Math.log(52.5));
  const embryo = sa < 10;
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={`Illustration du bébé à ${sa} SA`}>
      <circle cx="100" cy="100" r="96" fill="var(--womb)" />
      <circle cx="100" cy="100" r="96" fill="none" stroke="var(--line)" strokeWidth="2" />
      <g transform={`translate(100 100) scale(${scale * 1.7}) translate(-50 -52)`}>
        {embryo ? (
          <>
            <path d="M54 20c20 4 26 30 14 50-8 13-24 18-30 9-4-6 2-11 4-16 3-7-6-12-8-21-3-14 7-24 20-22Z" fill="var(--fetus)" />
            <circle cx="50" cy="30" r="13" fill="var(--fetus)" />
            <circle cx="46" cy="29" r="2" fill="var(--ink)" opacity=".35" />
            {sa >= 7 && <path d="M60 50c6 2 8 6 8 10" stroke="var(--fetus)" strokeWidth="5" strokeLinecap="round" fill="none" />}
          </>
        ) : (
          <>
            <ellipse cx="58" cy="66" rx="25" ry="21" transform="rotate(-28 58 66)" fill="var(--fetus)" />
            <circle cx="40" cy="34" r="21" fill="var(--fetus)" />
            <path d="M32 33q4 3 8 0" stroke="var(--ink)" strokeOpacity=".4" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <circle cx="27" cy="40" r="2.2" fill="var(--accent)" opacity=".25" />
            <path d="M46 54q-10 6-14 14" stroke="var(--fetus)" strokeWidth="7" strokeLinecap="round" fill="none" />
            <path d="M46 54q-10 6-14 14" stroke="var(--ink)" strokeOpacity=".08" strokeWidth="7" strokeLinecap="round" fill="none" />
            <path d="M76 78q-6 14-26 12" stroke="var(--fetus)" strokeWidth="9" strokeLinecap="round" fill="none" />
            <path d="M76 78q-6 14-26 12" stroke="var(--ink)" strokeOpacity=".08" strokeWidth="9" strokeLinecap="round" fill="none" />
          </>
        )}
      </g>
    </svg>
  );
}
