import { defineCollection, z } from 'astro:content';
import { createCostEntrySchema } from './cost/schema';

const cost = defineCollection({
  type: 'data',
  schema: createCostEntrySchema(z),
});

export const collections = {
  cost,
};
