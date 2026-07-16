export interface IJob {
  _id: string;
  JobID: string;
  JobTitle: string;
  Company: string;
  Location: string;
  ApplicationURL: string;
  DirectApplyURL: string | null;
  PostedDate: string | null;
  Description: string;
  DescriptionHtml?: string | null;
  GermanRequired?: boolean;
  Department: string;
  WorkplaceType: string;
  Category?: string;
  Domain: string;
  SubDomain: string;
  ExperienceLevel: string;
  SalaryCurrency: string | null;
  SalaryMin: number | null;
  SalaryMax: number | null;
  SalaryInterval: string | null;
  ATSPlatform: string;
  AllLocations: string[];
  EmploymentType: string | null;
  Country: string | null;
  Team: string | null;
  Office: string | null;
  IsRemote: boolean;
  Tags: string[];
  isEntryLevel: boolean;
  ContractType?: string;
  sourceSite?: string;
  Status?: 'pending_review' | 'active' | 'rejected';
  ConfidenceScore: number;
  applyClicks: number;
  scrapedAt?: string;
  RejectionReason?: string;
}

export interface ICompany {
  _id?: string;
  companyName: string;
  openRoles: number;
  cities: string[];
  domain: string;
  source: 'scraped' | 'manual';
  logo?: string;
  industry?: string;
}