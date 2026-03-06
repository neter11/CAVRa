import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  type: text("type").notNull(),
  rentAmount: integer("rent_amount").notNull(),
  isAgencyManaged: boolean("is_agency_managed").notNull().default(false),
  agencyFee: integer("agency_fee").default(0),
  status: text("status").notNull().default("available"), 
  contractStart: timestamp("contract_start"),
  contractEnd: timestamp("contract_end"),
  imageUrl: text("image_url"),
});

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  date: timestamp("date").defaultNow(),
});

export const propertiesRelations = relations(properties, ({ many }) => ({
  notes: many(notes),
  expenses: many(expenses),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  property: one(properties, {
    fields: [notes.propertyId],
    references: [properties.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  property: one(properties, {
    fields: [expenses.propertyId],
    references: [properties.id],
  }),
}));

export const insertPropertySchema = createInsertSchema(properties).omit({ id: true });
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type UpdatePropertyRequest = Partial<InsertProperty>;

export const insertNoteSchema = createInsertSchema(notes).omit({ id: true, createdAt: true });
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, date: true });
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
