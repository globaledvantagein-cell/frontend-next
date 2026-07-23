// Renders a JSON-LD <script> with `<` escaped, matching the backend SEO output.

export default function JsonLd({ data }: { data: unknown }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export function itemListJsonLd(
  name: string,
  jobs: { _id: string; JobTitle: string; Company: string }[],
  siteUrl: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: jobs.length,
    itemListElement: jobs.map((j, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${j.JobTitle} — ${j.Company}`,
      url: `${siteUrl}/jobs/${j._id}`,
    })),
  };
}

// Map canonical filterEmployment values to schema.org employmentType enums.
const EMPLOYMENT_SCHEMA: Record<string, string> = {
  fulltime: 'FULL_TIME',
  parttime: 'PART_TIME',
  contract: 'CONTRACTOR',
  internship: 'INTERN',
};

/**
 * schema.org JobPosting — required for Google for Jobs eligibility and the
 * primary signal AI answer engines (AEO/GEO) use to cite job listings.
 * Built only from public fields; omits anything unknown rather than guessing.
 */
export function jobPostingJsonLd(
  job: {
    _id: string; JobTitle: string; Company: string; Location?: string;
    Description?: string; PostedDate?: string | null; scrapedAt?: string;
    filterEmployment?: string | null; filterWorkplace?: string | null;
    filterSalaryMin?: number | null; filterSalaryMax?: number | null;
  },
  siteUrl: string,
) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.JobTitle,
    // Deliberately a TEASER, not the full JD — full descriptions stay behind
    // the signup/premium gate. 250 chars is enough for search/AI snippets
    // without giving the whole posting away in page source.
    description: ((job.Description || '').replace(/\s+/g, ' ').trim().slice(0, 250)
      || `${job.JobTitle} at ${job.Company} — an English-speaking role in Germany. No German required.`) + ' … Sign up to view the full description.',
    datePosted: job.PostedDate || job.scrapedAt || undefined,
    hiringOrganization: { '@type': 'Organization', name: job.Company },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'DE',
        ...(job.Location && !/remote/i.test(job.Location) ? { addressLocality: job.Location.split(',')[0].trim() } : {}),
      },
    },
    url: `${siteUrl}/jobs/${job._id}`,
    directApply: true,
  };
  const employmentType = job.filterEmployment ? EMPLOYMENT_SCHEMA[job.filterEmployment] : undefined;
  if (employmentType) data.employmentType = employmentType;
  if (job.filterWorkplace === 'remote') {
    data.jobLocationType = 'TELECOMMUTE';
    data.applicantLocationRequirements = { '@type': 'Country', name: 'Germany' };
  }
  if (job.filterSalaryMin != null || job.filterSalaryMax != null) {
    data.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: 'EUR',
      value: {
        '@type': 'QuantitativeValue',
        ...(job.filterSalaryMin != null ? { minValue: job.filterSalaryMin } : {}),
        ...(job.filterSalaryMax != null ? { maxValue: job.filterSalaryMax } : {}),
        unitText: 'YEAR',
      },
    };
  }
  return data;
}

export function breadcrumbJsonLd(crumbs: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}
