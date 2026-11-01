import { IMPORT_SKIP_REASON, IMPORT_WARNING_KIND } from '@entities/notes';
import {
  CLIENT_SKIP_REASON,
  CLIENT_WARNING_KIND,
  type SkipReason,
  type WarningKind,
} from '../model/report.types';

export const SKIP_REASON_LABELS: Record<SkipReason, string> = {
  [IMPORT_SKIP_REASON.notMarkdown]: 'Not markdown (attachments, images, other files)',
  [IMPORT_SKIP_REASON.hidden]: 'Hidden files and folders (.obsidian, .git, …)',
  [IMPORT_SKIP_REASON.binary]: 'Not text',
  [IMPORT_SKIP_REASON.empty]: 'Empty, and nothing links to them',
  [IMPORT_SKIP_REASON.duplicatePath]: 'The same path twice',
  [IMPORT_SKIP_REASON.invalidPath]: 'Invalid path',
  [CLIENT_SKIP_REASON.tooLarge]: 'Larger than one note can be (1 000 000 characters)',
};

export const WARNING_LABELS: Record<WarningKind, string> = {
  [IMPORT_WARNING_KIND.lossyContent]:
    'Tables, images, HTML or footnotes: kept in the text, but the editor does not show them and editing the note may drop them',
  [IMPORT_WARNING_KIND.unresolvedLink]: 'Links to notes that are not in the import (left as text)',
  [IMPORT_WARNING_KIND.ambiguousLink]: 'Links matching several notes (the closest one was used)',
  [IMPORT_WARNING_KIND.unsafeLink]: 'Unsafe links removed (only http, https and mailto are kept)',
  [IMPORT_WARNING_KIND.attachmentSkipped]: 'Links to attachments, which are not imported',
  [IMPORT_WARNING_KIND.titleFallback]: 'No title, a default one was used',
  [IMPORT_WARNING_KIND.titleTruncated]: 'Titles shortened to 200 characters',
  [CLIENT_WARNING_KIND.garbledName]:
    'File names in an unknown encoding: letters like ą or ł may be wrong',
};
