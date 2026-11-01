import { describe, expect, it } from 'vitest';
import { repairZipName } from './zipEntryName';

/** How fflate reads a UTF-8 name stored without the UTF-8 flag: byte by byte, as Latin-1. */
const asLatin1 = (name: string) => String.fromCharCode(...new TextEncoder().encode(name));

describe('repairZipName', () => {
  it('re-reads a UTF-8 name stored without the flag', () => {
    expect(repairZipName(asLatin1('Notatki/żółw.md'))).toEqual({
      name: 'Notatki/żółw.md',
      garbled: false,
    });
  });

  it.each(['Notatki/żółw.md', 'Kraków.md', 'plain.md'])('keeps a proper name %s', (name) => {
    expect(repairZipName(name)).toEqual({ name, garbled: false });
  });

  it('flags a name in another code page', () => {
    // "ł" in CP437/852 is byte 0x88, read as the C1 control U+0088.
    expect(repairZipName('Notatki/\u0088adne.md')).toEqual({
      name: 'Notatki/\u0088adne.md',
      garbled: true,
    });
  });
});
