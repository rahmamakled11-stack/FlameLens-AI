import { apiClient, type ApiEnvelope } from "@/api/client";
import type {
  ExperimentDetails,
  ExperimentsResponse,
} from "@/features/experiments/types/experiment";

export interface GetExperimentsInput {
  search: string;
  program: string;
  mission: string;
  page: number;
  pageSize: number;
}

export const getExperiments = async ({
  search,
  program,
  mission,
  page,
  pageSize,
}: GetExperimentsInput): Promise<ExperimentsResponse> => {
  const { data } = await apiClient.get<ExperimentsResponse>("/experiments", {
    params: {
      q: search.trim() || undefined,
      program: program.trim() || undefined,
      mission: mission.trim() || undefined,
      page,
      per_page: pageSize,
      sort: "title",
      direction: "asc",
    },
  });

  return data;
};

export const getExperimentById = async (experimentId: string): Promise<ExperimentDetails> => {
  const { data } = await apiClient.get<ApiEnvelope<ExperimentDetails>>(
    `/experiments/${encodeURIComponent(experimentId)}`,
  );
  return data.data;
};
