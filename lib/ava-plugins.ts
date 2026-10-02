/**
 * Downloadable Moodle plugins offered on the "Configuração do AVA" page.
 *
 * The ZIPs live in `public/downloads/` and are served statically. When a plugin
 * is rebuilt, replace the ZIP in public/downloads and bump `version` +
 * `updatedAt` here so the page shows the current build and date.
 */
export interface AvaPlugin {
  /** Static path served from public/. */
  file: string;
  /** Human release version (matches version.php `release`). */
  version: string;
  /** ISO date (YYYY-MM-DD) the ZIP was last rebuilt — shown in the UI. */
  updatedAt: string;
  /** Approx download size, shown next to the button. */
  size: string;
  /** Optional illustrated step-by-step guide (PDF), also served from public/. */
  guide?: string;
}

export const AVA_PLUGINS: Record<'activity' | 'block' | 'grading', AvaPlugin> = {
  activity: {
    file: '/downloads/tutoria-plugin.zip',
    version: '1.0.0',
    updatedAt: '2026-09-08',
    size: '34 KB',
  },
  block: {
    file: '/downloads/tutoria-block.zip',
    version: '1.0.2',
    updatedAt: '2026-09-08',
    size: '16 KB',
  },
  // Assistente de Correção — Moodle quiz report plugin (quiz_tutoria). The ZIP's
  // root folder is `tutoria/`; Moodle installs it to mod/quiz/report/tutoria.
  grading: {
    file: '/downloads/quiz-tutoria.zip',
    version: '1.3.0',
    updatedAt: '2026-10-02',
    size: '39 KB',
    // pt-BR only. The plugin's in-page help links here too
    // (quiz_tutoria report.php GUIDE_URL) — keep the path stable.
    guide: '/downloads/guia-assistente-de-correcao.pdf',
  },
};
