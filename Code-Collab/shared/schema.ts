import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

// Game specific user data (extending auth user)
export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey().references(() => users.id),
  balance: integer("balance").notNull().default(0),
  totalOpened: integer("total_opened").notNull().default(0),
  bestDrop: integer("best_drop").notNull().default(0),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(), // Price in cents or basic units
  image: text("image").notNull(), // Emoji or URL
  rarity: text("rarity").notNull(), // common, rare, epic, legendary
});

export const cases = pgTable("cases", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  image: text("image").notNull(),
  description: text("description"),
});

export const caseItems = pgTable("case_items", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => cases.id),
  itemId: integer("item_id").notNull().references(() => items.id),
  chance: doublePrecision("chance").notNull(), // Percentage 0-1 or 0-100
});

export const userItems = pgTable("user_items", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  itemId: integer("item_id").notNull().references(() => items.id),
  isSold: boolean("is_sold").notNull().default(false),
  openedAt: timestamp("opened_at").defaultNow(),
});

// Relations
export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const casesRelations = relations(cases, ({ many }) => ({
  items: many(caseItems),
}));

export const caseItemsRelations = relations(caseItems, ({ one }) => ({
  case: one(cases, {
    fields: [caseItems.caseId],
    references: [cases.id],
  }),
  item: one(items, {
    fields: [caseItems.itemId],
    references: [items.id],
  }),
}));

export const userItemsRelations = relations(userItems, ({ one }) => ({
  user: one(users, {
    fields: [userItems.userId],
    references: [users.id],
  }),
  item: one(items, {
    fields: [userItems.itemId],
    references: [items.id],
  }),
}));

// Schemas
export const insertProfileSchema = createInsertSchema(profiles);
export const insertItemSchema = createInsertSchema(items).omit({ id: true });
export const insertCaseSchema = createInsertSchema(cases).omit({ id: true });
export const insertCaseItemSchema = createInsertSchema(caseItems).omit({ id: true });

// Types
export type Profile = typeof profiles.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Case = typeof cases.$inferSelect;
export type CaseItem = typeof caseItems.$inferSelect;
export type UserItem = typeof userItems.$inferSelect;
