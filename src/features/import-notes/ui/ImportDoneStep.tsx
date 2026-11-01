import { AppAlert } from '@shared/ui/AppAlert';
import type { ImportReport } from '../model/report.types';
import { ImportReportView } from './ImportReportView';
import { IndexingProgress } from './IndexingProgress';

export const ImportDoneStep = ({ report }: { report: ImportReport }) => (
  <>
    <AppAlert status="success">The notes are imported and open on the left.</AppAlert>
    <ImportReportView report={report} />
    <IndexingProgress />
  </>
);
