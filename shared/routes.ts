import { z } from 'zod';
import { insertPropertySchema, properties, insertNoteSchema, notes, insertExpenseSchema, expenses } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  properties: {
    list: {
      method: 'GET' as const,
      path: '/api/properties' as const,
      responses: { 200: z.array(z.custom<typeof properties.$inferSelect>()) },
    },
    get: {
      method: 'GET' as const,
      path: '/api/properties/:id' as const,
      responses: {
        200: z.custom<typeof properties.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/properties' as const,
      input: insertPropertySchema,
      responses: {
        201: z.custom<typeof properties.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/properties/:id' as const,
      input: insertPropertySchema.partial(),
      responses: {
        200: z.custom<typeof properties.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/properties/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  notes: {
    list: {
      method: 'GET' as const,
      path: '/api/properties/:propertyId/notes' as const,
      responses: { 200: z.array(z.custom<typeof notes.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/properties/:propertyId/notes' as const,
      input: insertNoteSchema.omit({ propertyId: true }),
      responses: {
        201: z.custom<typeof notes.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/notes/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    }
  },
  expenses: {
    list: {
      method: 'GET' as const,
      path: '/api/properties/:propertyId/expenses' as const,
      responses: { 200: z.array(z.custom<typeof expenses.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/properties/:propertyId/expenses' as const,
      input: insertExpenseSchema.omit({ propertyId: true }),
      responses: {
        201: z.custom<typeof expenses.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/expenses/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
