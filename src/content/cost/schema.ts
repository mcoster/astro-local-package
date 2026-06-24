export const COST_ESTIMATE_DISCLAIMER =
  'Estimate only — final price depends on on-site assessment. Call for a quote.';

export interface CostRange {
  label: string;
  min: number;
  max: number;
  unit: string;
  currency?: string;
  notes?: string;
}

export interface CostSourceNote {
  label: string;
  note: string;
  url?: string;
}

export interface CostEntry {
  title: string;
  service: string;
  question: string;
  short_answer: string;
  detail?: string;
  service_area: string;
  cost_ranges: CostRange[];
  disclaimer: string;
  last_reviewed: string;
  assumptions: string[];
  inclusions: string[];
  exclusions: string[];
  approved_by: string;
  source_notes: CostSourceNote[];
}

export interface CostEntryValidationResult {
  valid: boolean;
  errors: string[];
}

type ZodLike = {
  object: (shape: Record<string, unknown>) => any;
  string: () => any;
  number: () => any;
  array: (schema: unknown) => any;
  literal: (value: string) => any;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasNonEmptyStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

function addRequiredStringError(entry: Record<string, unknown>, field: string, errors: string[]) {
  if (!isNonEmptyString(entry[field])) {
    errors.push(`${field} is required`);
  }
}

function addRequiredStringArrayError(entry: Record<string, unknown>, field: string, errors: string[]) {
  if (!hasNonEmptyStringArray(entry[field])) {
    errors.push(`${field} must include at least one item`);
  }
}

function validateCostRanges(value: unknown, errors: string[]) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push('cost_ranges must include at least one range');
    return;
  }

  value.forEach((range, index) => {
    if (!isObject(range)) {
      errors.push(`cost_ranges[${index}] must be an object`);
      return;
    }

    if (!isNonEmptyString(range.label)) {
      errors.push(`cost_ranges[${index}].label is required`);
    }

    if (!Number.isFinite(range.min) || Number(range.min) < 0) {
      errors.push(`cost_ranges[${index}].min must be a non-negative number`);
    }

    if (!Number.isFinite(range.max) || Number(range.max) < 0) {
      errors.push(`cost_ranges[${index}].max must be a non-negative number`);
    }

    if (Number.isFinite(range.min) && Number.isFinite(range.max) && Number(range.max) < Number(range.min)) {
      errors.push(`cost_ranges[${index}].max must be greater than or equal to min`);
    }

    if (!isNonEmptyString(range.unit)) {
      errors.push(`cost_ranges[${index}].unit is required`);
    }

    if (range.currency !== undefined && !isNonEmptyString(range.currency)) {
      errors.push(`cost_ranges[${index}].currency must be a non-empty string when provided`);
    }
  });
}

function validateSourceNotes(value: unknown, errors: string[]) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push('source_notes must include at least one item');
    return;
  }

  value.forEach((sourceNote, index) => {
    if (!isObject(sourceNote)) {
      errors.push(`source_notes[${index}] must be an object`);
      return;
    }

    if (!isNonEmptyString(sourceNote.label)) {
      errors.push(`source_notes[${index}].label is required`);
    }

    if (!isNonEmptyString(sourceNote.note)) {
      errors.push(`source_notes[${index}].note is required`);
    }

    if (sourceNote.url !== undefined && !isNonEmptyString(sourceNote.url)) {
      errors.push(`source_notes[${index}].url must be a non-empty string when provided`);
    }
  });
}

export function validateCostEntry(entry: unknown): CostEntryValidationResult {
  const errors: string[] = [];

  if (!isObject(entry)) {
    return {
      valid: false,
      errors: ['entry must be an object'],
    };
  }

  for (const field of ['title', 'service', 'question', 'short_answer', 'service_area', 'last_reviewed', 'approved_by']) {
    addRequiredStringError(entry, field, errors);
  }

  if (isNonEmptyString(entry.last_reviewed) && !/^\d{4}-\d{2}-\d{2}$/.test(entry.last_reviewed)) {
    errors.push('last_reviewed must use YYYY-MM-DD format');
  }

  if (entry.disclaimer !== COST_ESTIMATE_DISCLAIMER) {
    errors.push('disclaimer must match the approved estimate disclaimer');
  }

  for (const field of ['assumptions', 'inclusions', 'exclusions']) {
    addRequiredStringArrayError(entry, field, errors);
  }

  validateCostRanges(entry.cost_ranges, errors);
  validateSourceNotes(entry.source_notes, errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function createCostEntrySchema(z: ZodLike) {
  const costRangeSchema = z.object({
    label: z.string().min(1),
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
    unit: z.string().min(1),
    currency: z.string().min(1).default('AUD'),
    notes: z.string().optional(),
  }).superRefine((range: CostRange, context: any) => {
    if (range.max < range.min) {
      context.addIssue({
        code: 'custom',
        path: ['max'],
        message: 'max must be greater than or equal to min',
      });
    }
  });

  const sourceNoteSchema = z.object({
    label: z.string().min(1),
    note: z.string().min(1),
    url: z.string().url().optional(),
  });

  return z.object({
    title: z.string().min(1),
    service: z.string().min(1),
    question: z.string().min(1),
    short_answer: z.string().min(1),
    detail: z.string().optional(),
    service_area: z.string().min(1),
    cost_ranges: z.array(costRangeSchema).min(1),
    disclaimer: z.literal(COST_ESTIMATE_DISCLAIMER),
    last_reviewed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    assumptions: z.array(z.string().min(1)).min(1),
    inclusions: z.array(z.string().min(1)).min(1),
    exclusions: z.array(z.string().min(1)).min(1),
    approved_by: z.string().min(1),
    source_notes: z.array(sourceNoteSchema).min(1),
  });
}
