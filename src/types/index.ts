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
  AllLocations: string[];
  EmploymentType: string | null;
  Country: string | null;
  Team: string | null;
  Office: string | null;
  IsRemote: boolean;
  Tags: string[];
  isEntryLevel: boolean;
  ContractType?: string;
  applyClicks: number;
  scrapedAt?: string;

  // Canonical reconciled filter fields (backend Chunk 1 normalizer).
  filterWorkplace: 'remote' | 'hybrid' | 'onsite' | null;
  filterExperience: 'entry' | 'mid' | 'senior' | 'lead' | 'executive' | null;
  filterEmployment: 'fulltime' | 'parttime' | 'contract' | 'internship' | null;
  filterVisa: 'available' | null;
  filterRelocation: 'available' | null;
  filterSalaryMin: number | null;
  filterSalaryMax: number | null;
  filterSalaryCurrency: string | null;
  filterSalaryInterval: string | null;
  filterSalaryTier: 'ats' | 'jd' | null;
}

/**
 * Admin/internal job shape. The public API strips these fields (data lockdown,
 * backend Chunk 1), so they live here — only admin/review views may read them.
 */
export interface IAdminJob extends IJob {
  ATSPlatform: string;
  sourceSite?: string;
  ConfidenceScore: number;
  Status?: 'pending_review' | 'active' | 'rejected';
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