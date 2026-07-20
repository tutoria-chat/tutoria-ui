/**
 * Maps the student-import backend error codes (StudentImportErrorCodes in
 * TutoriaApi) to localized messages under the `students.import.errors.*` i18n
 * namespace. Keeps the raw backend string as a fallback for unknown codes so we
 * never regress to a blank message.
 */

type Translator = (key: string, values?: Record<string, string | number>) => string;

/** Accepted spreadsheet extensions for enrollment import (kept in one place). */
export const ACCEPTED_IMPORT_EXTENSIONS = ['.csv', '.xlsx', '.xls'] as const;

/** The `accept` attribute value for the file inputs. */
export const ACCEPTED_IMPORT_ACCEPT = ACCEPTED_IMPORT_EXTENSIONS.join(',');

export function isAcceptedImportFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ACCEPTED_IMPORT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

// Backend error code → i18n key (relative to the `students.import` namespace).
// Note: `errorCodes` (not `errors`, which is an existing "Errors" label).
const CODE_TO_KEY: Record<string, string> = {
  MISSING_EMAIL_COLUMN: 'errorCodes.missingEmailColumn',
  STUDENT_LIMIT_EXCEEDED: 'errorCodes.studentLimitExceeded',
  NO_DATA_ROWS: 'errorCodes.noDataRows',
  EMPTY_FILE: 'errorCodes.emptyFile',
  UNSUPPORTED_FORMAT: 'errorCodes.unsupportedFormat',
  FILE_REQUIRED: 'errorCodes.fileRequired',
  EMAIL_REQUIRED: 'errorCodes.emailRequired',
  MATRICULA_REQUIRED: 'errorCodes.matriculaRequired',
  EMAIL_BELONGS_TO_NON_STUDENT: 'errorCodes.emailBelongsToNonStudent',
};

/**
 * Translate an import error into a friendly localized message.
 * @param t        the `students.import` translator (useTranslations('students.import'))
 * @param code     backend error code, if any
 * @param context  structured context from the backend (headers, limits, ...)
 * @param fallback raw message to show when the code is unknown/absent
 */
export function translateImportError(
  t: Translator,
  code: string | undefined,
  context: Record<string, unknown> | undefined,
  fallback: string,
): string {
  const key = code ? CODE_TO_KEY[code] : undefined;
  if (!key) return fallback || '';

  // Provide safe defaults for every placeholder any message might reference,
  // so next-intl never throws on a missing interpolation value.
  const values: Record<string, string | number> = {
    headers: Array.isArray(context?.headers) ? (context!.headers as string[]).join(', ') : '',
    current: typeof context?.current === 'number' ? (context!.current as number) : 0,
    limit: typeof context?.limit === 'number' ? (context!.limit as number) : 0,
    newEnrollments: typeof context?.newEnrollments === 'number' ? (context!.newEnrollments as number) : 0,
  };

  return t(key, values);
}
