const NON_ASCII = /[\u0080-\u00ff]/;
const isLatin1 = (text: string) => [...text].every((char) => char.charCodeAt(0) <= 0xff);
// C1 controls never appear in a real file name; they are what a mis-decoded name looks like.
const C1_CONTROL = /[\u0080-\u009f]/;

/**
 * Zip entry names without the UTF-8 flag are read as Latin-1. Archives made on macOS store
 * UTF-8 without the flag, so "Notatki/żółw.md" arrives as mojibake: re-read such a name as UTF-8.
 * Returns whether the name still looks garbled (e.g. CP437 from Windows).
 */
export const repairZipName = (name: string): { name: string; garbled: boolean } => {
  if (NON_ASCII.test(name) && isLatin1(name)) {
    const bytes = Uint8Array.from(name, (char) => char.charCodeAt(0));
    try {
      const repaired = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      return { name: repaired, garbled: false };
    } catch {
      // Not UTF-8: a real Latin-1 name, or another code page.
    }
  }
  return { name, garbled: C1_CONTROL.test(name) };
};
