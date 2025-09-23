export type AnalysisMode = 'profile' | 'videos';

export interface AnalysisProgress {
  step: string;
  current: number;
  total: number;
}

export interface FirestorePersona {
  id: string;
  name: string;
  description: string;
  platform: string;
  username: string;
  tags?: string[];
  analysis?: unknown;
  creationStatus?: 'pending' | 'videos_collected' | 'analyzed' | 'created';
  videoUrls?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: unknown;
}
