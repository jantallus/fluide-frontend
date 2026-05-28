export interface SeasonPeriod {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  pattern: 'daily' | 'weekends';
}

// Saison 2026 — à mettre à jour chaque année
export const SEASON_PERIODS: SeasonPeriod[] = [
  { start: '2026-06-13', end: '2026-07-04', pattern: 'weekends' },
  { start: '2026-07-05', end: '2026-08-30', pattern: 'daily'    },
  { start: '2026-08-31', end: '2026-09-20', pattern: 'weekends' },
];

export interface SeasonMessage {
  headline: string;
  lines: string[];
  offSeason: boolean;
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

export function getSeasonMessage(
  todayStr: string,
  nextAvailStr?: string | null,
): SeasonMessage | null {
  // Périodes pas encore terminées
  const ahead = SEASON_PERIODS.filter(p => p.end >= todayStr);

  if (ahead.length === 0) {
    return { headline: 'En dehors de la saison', lines: [], offSeason: true };
  }

  const first = ahead[0];
  const second = ahead[1] ?? null;
  const inFirst = first.start <= todayStr;

  const lines: string[] = [];

  if (inFirst) {
    // On est dans une période
    if (first.pattern === 'weekends') {
      // Utilise la prochaine dispo DB comme point de départ précis si disponible
      const from = nextAvailStr && nextAvailStr > todayStr && nextAvailStr <= first.end
        ? fmtDate(nextAvailStr)
        : null;
      lines.push(from
        ? `les weekends du ${from} au ${fmtDate(first.end)}`
        : `les weekends jusqu'au ${fmtDate(first.end)}`
      );
    } else {
      lines.push(`tous les jours jusqu'au ${fmtDate(first.end)}`);
    }

    if (second) {
      const label = second.pattern === 'daily' ? 'tous les jours' : 'les weekends';
      lines.push(`puis ${label} jusqu'au ${fmtDate(second.end)}`);
    }

    return { headline: 'Dispos en ligne', lines, offSeason: false };
  } else {
    // On est avant la prochaine période
    const startLabel = fmtDate(first.start);
    const patternLabel = first.pattern === 'daily' ? 'tous les jours' : 'les weekends';
    lines.push(`à partir du ${startLabel} ${patternLabel}`);

    if (second) {
      const label2 = second.pattern === 'daily' ? 'tous les jours' : 'les weekends';
      lines.push(`puis ${label2} à partir du ${fmtDate(second.start)}`);
    }

    return { headline: 'Prochaines dispos en ligne', lines, offSeason: false };
  }
}
