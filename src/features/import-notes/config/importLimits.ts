/** KEEP IN SYNC with notes-app-be/src/modules/notes/consts/import.consts.ts and validator.consts.ts. */
export const MAX_IMPORT_FILES = 2000;
/** Total size of the imported text, in UTF-8 bytes. */
export const MAX_IMPORT_TOTAL_BYTES = 15 * 1024 * 1024;
/** Characters of one note (`MAX_CONTENT_LENGTH`). */
export const MAX_NOTE_CONTENT_LENGTH = 1_000_000;
export const MAX_IMPORT_NAME_LENGTH = 200;

/** A zip inside the picked zip (Notion splits large exports so) is unpacked up to this size. */
export const MAX_NESTED_ZIP_BYTES = 200 * 1024 * 1024;
