import { z } from 'zod';
import { insertPropertySchema, properties, insertNoteSchema, notes, insertExpenseSchema, expenses, tasks, insertTaskSchema } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

// Helper to create a response schema that coerces dates from JSON strings
const propertyResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  location: z.string(),
  type: z.string(),
  rentAmount: z.number(),
  isAgencyManaged: z.boolean(),
  agencyFee: z.number().nullable(),
  status: z.string(),
  contractStart: z.coerce.date().nullable(),
  contractEnd: z.coerce.date().nullable(),
  imageUrl: z.string().nullable(),
});

const noteResponseSchema = z.object({
  id: z.number(),
  propertyId: z.number(),
  content: z.string(),
  createdAt: z.coerce.date().nullable(),
});

const expenseResponseSchema = z.object({
  id: z.number(),
  propertyId: z.number(),
  description: z.string(),
  amount: z.number(),
  date: z.coerce.date().nullable(),
});

const taskResponseSchema = z.object({
  id: z.number(),
  propertyId: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  cost: z.number(),
  dueDate: z.coerce.date().nullable(),
  status: z.string(),
  createdAt: z.coerce.date().nullable(),
});

export const api = {
  properties: {
    list: {
      method: 'GET' as const,
      path: '/api/properties' as const,
      responses: { 200: z.array(propertyResponseSchema) },
    },
    get: {
      method: 'GET' as const,
      path: '/api/properties/:id' as const,
      responses: {
        200: propertyResponseSchema,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/properties' as const,
      input: insertPropertySchema,
      responses: {
        201: propertyResponseSchema,
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/properties/:id' as const,
      input: insertPropertySchema.partial(),
      responses: {
        200: propertyResponseSchema,
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
      responses: { 200: z.array(noteResponseSchema) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/properties/:propertyId/notes' as const,
      input: insertNoteSchema.omit({ propertyId: true }),
      responses: {
        201: noteResponseSchema,
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
      responses: { 200: z.array(expenseResponseSchema) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/properties/:propertyId/expenses' as const,
      input: insertExpenseSchema.omit({ propertyId: true }),
      responses: {
        201: expenseResponseSchema,
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
  },
  tasks: {
    list: {
      method: 'GET' as const,
      path: '/api/tasks' as const,
      responses: { 200: z.array(taskResponseSchema) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/tasks' as const,
      input: insertTaskSchema,
      responses: {
        201: taskResponseSchema,
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/tasks/:id' as const,
      input: insertTaskSchema.partial(),
      responses: {
        200: taskResponseSchema,
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    complete: {
      method: 'POST' as const,
      path: '/api/tasks/:id/complete' as const,
      responses: {
        200: taskResponseSchema,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/tasks/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
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
