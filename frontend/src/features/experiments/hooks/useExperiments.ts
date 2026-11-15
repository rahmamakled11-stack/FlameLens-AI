import { useQuery } from "@tanstack/react-query";
import {
  getExperimentById,
  getExperiments,
  type GetExperimentsInput,
} from "@/features/experiments/services/experimentsService";

export type ExplorerParams = GetExperimentsInput;

export const useExperiments = (params: ExplorerParams) =>
  useQuery({
    queryKey: ["experiments", "list", params],
    queryFn: () => getExperiments(params),
    retry: false,
  });

export const useExperimentById = (experimentId: string) =>
  useQuery({
    queryKey: ["experiments", "detail", experimentId],
    queryFn: () => getExperimentById(experimentId),
    enabled: Boolean(experimentId),
    retry: false,
  });
