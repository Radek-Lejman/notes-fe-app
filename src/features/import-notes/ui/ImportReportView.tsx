import { Box, List, Stack, Text } from '@chakra-ui/react';
import { SKIP_REASON_LABELS, WARNING_LABELS } from '../config/reportLabels';
import type { ImportReport } from '../model/report.types';

// Long lists (a vault's attachments) are cut; the counts stay exact.
const MAX_LISTED = 50;

const groupBy = <Item, Key extends string>(items: Item[], key: (item: Item) => Key) => {
  const groups = new Map<Key, Item[]>();
  for (const item of items) {
    const group = groups.get(key(item));
    if (group) group.push(item);
    else groups.set(key(item), [item]);
  }
  return [...groups.entries()];
};

const Group = ({ label, lines }: { label: string; lines: string[] }) => (
  <Box as="details" fontSize="sm">
    <Box as="summary" cursor="pointer">
      {label}: {lines.length}
    </Box>
    <List.Root ps={5} color="fg.muted" wordBreak="break-all">
      {lines.slice(0, MAX_LISTED).map((line, index) => (
        <List.Item key={index}>{line}</List.Item>
      ))}
      {lines.length > MAX_LISTED && <List.Item>… and {lines.length - MAX_LISTED} more</List.Item>}
    </List.Root>
  </Box>
);

export const ImportReportView = ({ report }: { report: ImportReport }) => {
  const skipped = groupBy(report.skipped, (file) => file.reason);
  const warnings = groupBy(report.warnings, (warning) => warning.kind);

  return (
    <Stack gap={3}>
      <Text fontWeight="semibold">
        {report.dryRun ? 'Notes to create' : 'Notes created'}: {report.created}
        <Text as="span" fontWeight="normal" color="fg.muted">
          {' '}
          (folders and the import note included)
        </Text>
      </Text>

      {warnings.length > 0 && (
        <Stack gap={1}>
          <Text fontWeight="semibold">Warnings</Text>
          {warnings.map(([kind, items]) => (
            <Group
              key={kind}
              label={WARNING_LABELS[kind]}
              lines={items.map((item) =>
                item.detail ? `${item.path}: ${item.detail}` : item.path,
              )}
            />
          ))}
        </Stack>
      )}

      {skipped.length > 0 && (
        <Stack gap={1}>
          <Text fontWeight="semibold">Skipped files</Text>
          {skipped.map(([reason, items]) => (
            <Group
              key={reason}
              label={SKIP_REASON_LABELS[reason]}
              lines={items.map((item) => item.path)}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
};
