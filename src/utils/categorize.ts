/**
 * Frontend Category constants — labels + display order only.
 *
 * Classification itself runs ON THE BACKEND at scrape time and is stored in
 * the Category field on each job. The frontend just sends `?category=X` to
 * the API and reads the field off teaser results.
 *
 * Counts come from GET /api/jobs/category-counts.
 */

export type Category =
  | 'software'
  | 'data'
  | 'product_tech'
  | 'other_tech'
  | 'product_nontech'
  | 'other_nontech';

export const CATEGORY_LABELS: Record<Category, string> = {
  software:        'Software Engineering',
  data:            'Data / AI',
  product_tech:    'Product (Tech)',
  other_tech:      'Other Technical',
  product_nontech: 'Product (Non-Tech)',
  other_nontech:   'Other Non-Technical',
};

export const CATEGORY_ORDER: Category[] = [
  'software',
  'data',
  'product_tech',
  'other_tech',
  'product_nontech',
  'other_nontech',
];