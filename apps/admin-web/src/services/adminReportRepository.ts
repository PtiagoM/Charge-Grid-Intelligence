import type { AdminState, ReportJob } from "../domain/admin";
import { generateReportArtifact, type ReportArtifact } from "../domain/reportOperations";

export interface AdminReportRepository {
  generate(state: AdminState, job: ReportJob): Promise<ReportArtifact>;
}

export const demoAdminReportRepository: AdminReportRepository = {
  async generate(state, job) {
    await new Promise((resolve) => setTimeout(resolve, 40));
    return generateReportArtifact(state, job);
  }
};
