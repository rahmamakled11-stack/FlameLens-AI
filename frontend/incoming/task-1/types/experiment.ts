export interface Experiment {
  id: string;               // NASA Experiment ID
  name: string;             // e.g. BASS
  category: string;         // e.g. Combustion
  description: string;
  dataAvailability: "available" | "unavailable";
  keywords: string[];
  startDate?: string;
  institution?: string;
}

export interface Stats {
  researchPapers: number;
  experiments: number;
  researchAreas: number;
  dataSources: number;
}

export interface ActivityPoint {
  month: string;
  papers: number;
  experiments: number;
}
