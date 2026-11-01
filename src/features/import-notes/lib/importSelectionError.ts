/** The picked selection can not be imported at all (too large, too many files, broken zip). */
export class ImportSelectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportSelectionError';
  }
}
