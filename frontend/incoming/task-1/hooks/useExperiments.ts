import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";

export const useStats = () =>
  useQuery({ queryKey: ["stats"], queryFn: api.getStats });

export const useActivity = () =>
  useQuery({ queryKey: ["activity"], queryFn: api.getActivity });

export const useFeatured = () =>
  useQuery({ queryKey: ["featured"], queryFn: api.getFeatured });

export interface ExplorerParams {
  search: string;
  category: string;
  dataAvailability: string;
  page: number;
  pageSize: number;
}

export const useExperiments = (p: ExplorerParams) =>
  useQuery({
    queryKey: ["experiments", p],
    queryFn: () =>
      api.getExperiments({
        q: p.search,
        category: p.category,
        availability: p.dataAvailability,
        page: p.page,
        pageSize: p.pageSize,
      }),
    placeholderData: (prev) => prev, // keep previous page while loading
  });
