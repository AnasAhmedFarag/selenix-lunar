export interface TimelinePoint {
  time: string;
  solarElevation: number;
  earthElevation: number | null;
  earthAzimuth: number | null;
  earthTerrainHorizon: number | null;
  terrainHorizon?: number;
  sunAzimuth?: number;
  solarVisible: boolean;
  earthVisible: boolean | null;
  combinedVisible: boolean | null;
}
export interface SiteAnalysis {
  id: string;
  name: string;
  coords: string;
  score: number | null;
  status: string;
  solar: number;
  earth: number | null;
  combined: number | null;
  horizon: string;
  obstruction: number;
  solarWindow: string;
  earthWindow: string;
  operationalWindow: string;
  imagePosition: string;
  solarAverageElevation: number | null;
  solarMaximumElevation: number | null;
  earthAverageElevation: number | null;
  earthMaximumElevation: number | null;
  jointWindowStart: string | null;
  points: TimelinePoint[];
  horizonProfile: number[];
}
export interface CompareResponse {
  start: string;
  days: number;
  stepHours: number;
  model: string;
  disclaimer: string;
  earthDataAvailable: boolean;
  sites: SiteAnalysis[];
}
