import { z } from 'zod';
import { items, cases, userItems, profiles } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// Response types including relations
const ItemSchema = z.custom<typeof items.$inferSelect>();
const CaseSchema = z.custom<typeof cases.$inferSelect & { items?: (typeof items.$inferSelect & { chance: number })[] }>();
const UserItemSchema = z.custom<typeof userItems.$inferSelect & { item: typeof items.$inferSelect }>();
const ProfileSchema = z.custom<typeof profiles.$inferSelect>();

export const api = {
  cases: {
    list: {
      method: 'GET' as const,
      path: '/api/cases',
      responses: {
        200: z.array(CaseSchema),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/cases/:id',
      responses: {
        200: CaseSchema,
        404: errorSchemas.notFound,
      },
    },
    open: {
      method: 'POST' as const,
      path: '/api/cases/:id/open',
      responses: {
        200: z.object({
          item: ItemSchema,
          userItem: UserItemSchema,
          balance: z.number(),
        }),
        400: errorSchemas.validation, // Insufficient funds
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  inventory: {
    list: {
      method: 'GET' as const,
      path: '/api/inventory',
      responses: {
        200: z.array(UserItemSchema),
        401: errorSchemas.unauthorized,
      },
    },
    sell: {
      method: 'POST' as const,
      path: '/api/inventory/:id/sell',
      responses: {
        200: z.object({
          balance: z.number(),
          soldAmount: z.number(),
        }),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    sellAll: {
      method: 'POST' as const,
      path: '/api/inventory/sell-all',
      responses: {
        200: z.object({
          balance: z.number(),
          soldCount: z.number(),
          totalAmount: z.number(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  profile: {
    get: {
      method: 'GET' as const,
      path: '/api/profile',
      responses: {
        200: ProfileSchema,
        401: errorSchemas.unauthorized,
      },
    },
  },
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
