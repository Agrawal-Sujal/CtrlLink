export interface ShortenRequest {
  longUrl: string;
  customAlias?: string;
  expiryDays?: number;
  title?: string;
  password?: string;
  useAutoTitle?: boolean;
  tags?: string[];
}

export interface ShortenResponse {
  shortId: string;
  shortUrl: string;
  longUrl: string;
  createdAt: string;
  title?: string;
  passwordProtected: boolean;
  password?: string;
  category?: string;
  tags?: string[];
}

export interface UrlStatsResponse {
  shortId: string;
  longUrl: string;
  clickCount: number;
  lastAccessedTime?: string;
  createdAt: string;
  title?: string;
  passwordProtected: boolean;
  password?: string;
  timeSeries?: Record<string, number>;
  countries?: Record<string, number>;
  referrers?: Record<string, number>;
  devices?: Record<string, number>;
  orderIndex?: number;
  category?: string;
  tags?: string[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  size?: number;
  number?: number;
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface UpdateMetadataRequest {
  title?: string;
  password?: string;
}

export interface ResolvePasswordResponse {
  longUrl: string;
}

export interface TagSummary {
  tag: string;
  count: number;
}

