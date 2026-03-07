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
  type RentPayment,
  type InsertRentPayment,
  type PropertyPhoto,
  type InsertPropertyPhoto,
  type Tenant,
  type InsertTenant,
  properties,
  notes,
  expenses,
  tasks,
  rentPayments,
  propertyPhotos,
  tenants
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, or } from "drizzle-orm";

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

  // Rent Payments
  getRentPaymentsByPropertyId(propertyId: number, year: number): Promise<RentPayment[]>;
  toggleRentPayment(propertyId: number, month: number, year: number): Promise<void>;
  getAllRentPaymentsForMonth(month: number, year: number): Promise<RentPayment[]>;

  // Photos
  getPhotosByPropertyId(propertyId: number): Promise<PropertyPhoto[]>;
  addPhoto(propertyId: number, photo: Omit<InsertPropertyPhoto, "propertyId">): Promise<PropertyPhoto>;
  deletePhoto(id: number): Promise<void>;
  setCoverPhoto(id: number): Promise<PropertyPhoto | undefined>;

  // Tenants
  getTenantByPropertyId(propertyId: number): Promise<Tenant | undefined>;
  upsertTenant(propertyId: number, tenant: Omit<InsertTenant, "propertyId">): Promise<Tenant>;
}

export class DatabaseStorage implements IStorage {
  // Tenants
  async getTenantByPropertyId(propertyId: number): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.propertyId, propertyId));
    return tenant;
  }

  async upsertTenant(propertyId: number, insertTenant: Omit<InsertTenant, "propertyId">): Promise<Tenant> {
    const existing = await this.getTenantByPropertyId(propertyId);
    if (existing) {
      const [updated] = await db
        .update(tenants)
        .set(insertTenant)
        .where(eq(tenants.propertyId, propertyId))
        .returning();
      return updated;
    }
    const [newTenant] = await db
      .insert(tenants)
      .values({ ...insertTenant, propertyId })
      .returning();
    return newTenant;
  }

  // Photos
  async getPhotosByPropertyId(propertyId: number): Promise<PropertyPhoto[]> {
    return await db.select().from(propertyPhotos).where(eq(propertyPhotos.propertyId, propertyId));
  }

  async addPhoto(propertyId: number, insertPhoto: Omit<InsertPropertyPhoto, "propertyId">): Promise<PropertyPhoto> {
    const [photo] = await db
      .insert(propertyPhotos)
      .values({ ...insertPhoto, propertyId })
      .returning();
    return photo;
  }

  async deletePhoto(id: number): Promise<void> {
    await db.delete(propertyPhotos).where(eq(propertyPhotos.id, id));
  }

  async setCoverPhoto(id: number): Promise<PropertyPhoto | undefined> {
    const [photo] = await db.select().from(propertyPhotos).where(eq(propertyPhotos.id, id));
    if (!photo) return undefined;

    // Reset all covers for this property
    await db
      .update(propertyPhotos)
      .set({ isCover: false })
      .where(eq(propertyPhotos.propertyId, photo.propertyId));

    // Set new cover
    const [updated] = await db
      .update(propertyPhotos)
      .set({ isCover: true })
      .where(eq(propertyPhotos.id, id))
      .returning();

    // Update main property image
    await db
      .update(properties)
      .set({ imageUrl: updated.url })
      .where(eq(properties.id, photo.propertyId));

    return updated;
  }

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

  // Rent Payments
  async getRentPaymentsByPropertyId(propertyId: number, year: number): Promise<RentPayment[]> {
    return await db.select().from(rentPayments).where(
      and(
        eq(rentPayments.propertyId, propertyId),
        eq(rentPayments.year, year)
      )
    );
  }

  async toggleRentPayment(propertyId: number, month: number, year: number): Promise<void> {
    const existing = await db.select().from(rentPayments).where(
      and(
        eq(rentPayments.propertyId, propertyId),
        eq(rentPayments.month, month),
        eq(rentPayments.year, year)
      )
    );

    if (existing.length > 0) {
      await db.delete(rentPayments).where(
        and(
          eq(rentPayments.propertyId, propertyId),
          eq(rentPayments.month, month),
          eq(rentPayments.year, year)
        )
      );
    } else {
      await db.insert(rentPayments).values({
        propertyId,
        month,
        year,
        status: "paid"
      });
    }
  }

  async getAllRentPaymentsForMonth(month: number, year: number): Promise<RentPayment[]> {
    return await db.select().from(rentPayments).where(
      and(
        eq(rentPayments.month, month),
        eq(rentPayments.year, year)
      )
    );
  }
}

export const storage = new DatabaseStorage();
