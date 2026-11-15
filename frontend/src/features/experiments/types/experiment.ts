export interface Experiment {
  id: string;
  title: string;
  acronym: string | null;
  nasa_identifier: string | null;
  program: string | null;
  mission: string | null;
  summary: string | null;
  description: string | null;
  nasa_url: string | null;
  sources: ExperimentListSource[];
  source_count: number;
  publication_count: number;
  media_count: number;
  metric_count: number;
}

export interface ExperimentListSource {
  id: string;
  title: string;
  source_type: string;
  source_url: string;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

export interface ExperimentsResponse {
  data: Experiment[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

export interface ExperimentSection {
  id: string;
  section_type: string;
  title: string;
  content: string | null;
  display_order: number;
  source: ExperimentSource | null;
}

export interface ExperimentSource {
  id: string;
  title: string;
  source_type: string;
  source_url: string;
  publisher: string | null;
  publication_date: string | null;
  accessed_at: string | null;
}

export interface ExperimentPublication {
  id: string;
  title: string;
  authors: string[] | null;
  publication_type: string | null;
  journal: string | null;
  doi: string | null;
  publication_url: string | null;
  publication_date: string | null;
  abstract: string | null;
}

export interface ExperimentMedia {
  id: string;
  title: string;
  description: string | null;
  media_type: string;
  media_url: string;
  thumbnail_url: string | null;
  source: ExperimentSource | null;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface ExperimentMetric {
  id: string;
  metric_name: string;
  metric_value: string | null;
  unit: string | null;
  conditions: JsonValue | null;
  source: ExperimentSource | null;
}

export interface ExperimentDetails extends Omit<Experiment, "sources" | "source_count" | "publication_count" | "media_count" | "metric_count"> {
  sections: ExperimentSection[];
  sources: ExperimentSource[];
  publications: ExperimentPublication[];
  media: ExperimentMedia[];
  metrics: ExperimentMetric[];
}
