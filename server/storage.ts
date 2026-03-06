import {
  type Property,
  type InsertProperty,
  type UpdatePropertyRequest,
  type Note,
  type InsertNote,
  type Expense,
  type InsertExpense,
  type Task,
  type InsertTask,
  properties,
  notes,
  expenses,
  tasks
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Properties
  getProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: UpdatePropertyRequest): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<void>;

  // Notes
  getNotesByPropertyId(propertyId: number): Promise<Note[]>;
  createNote(propertyId: number, note: Omit<InsertNote, "propertyId">): Promise<Note>;
  deleteNote(id: number): Promise<void>;

  // Expenses
  getExpensesByPropertyId(propertyId: number): Promise<Expense[]>;
  createExpense(propertyId: number, expense: Omit<InsertExpense, "propertyId">): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;

  // Tasks
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<void>;
  completeTask(id: number): Promise<Task | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Properties
  async getProperties(): Promise<Property[]> {
    return await db.select().from(properties);
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const [property] = await db.insert(properties).values(insertProperty).returning();
    return property;
  }

  async updateProperty(id: number, updateData: UpdatePropertyRequest): Promise<Property | undefined> {
    const [property] = await db
      .update(properties)
      .set(updateData)
      .where(eq(properties.id, id))
      .returning();
    return property;
  }

  async deleteProperty(id: number): Promise<void> {
    await db.delete(properties).where(eq(properties.id, id));
  }

  // Notes
  async getNotesByPropertyId(propertyId: number): Promise<Note[]> {
    return await db.select().from(notes).where(eq(notes.propertyId, propertyId));
  }

  async createNote(propertyId: number, insertNote: Omit<InsertNote, "propertyId">): Promise<Note> {
    const [note] = await db
      .insert(notes)
      .values({ ...insertNote, propertyId })
      .returning();
    return note;
  }

  async deleteNote(id: number): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }

  // Expenses
  async getExpensesByPropertyId(propertyId: number): Promise<Expense[]> {
    return await db.select().from(expenses).where(eq(expenses.propertyId, propertyId));
  }

  async createExpense(propertyId: number, insertExpense: Omit<InsertExpense, "propertyId">): Promise<Expense> {
    const [expense] = await db
      .insert(expenses)
      .values({ ...insertExpense, propertyId })
      .returning();
    return expense;
  }

  async deleteExpense(id: number): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTask(id: number, updateData: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async completeTask(id: number): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({ status: "completed" })
      .where(eq(tasks.id, id))
      .returning();
    
    if (task) {
      await this.createExpense(task.propertyId, {
        description: `Tarefa Concluída: ${task.title}`,
        amount: task.cost,
      });
    }
    
    return task;
  }
}

export const storage = new DatabaseStorage();
