import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // -- PROPERTIES --
  app.get(api.properties.list.path, async (req, res) => {
    const allProperties = await storage.getProperties();
    res.json(allProperties);
  });

  app.get(api.properties.get.path, async (req, res) => {
    const id = Number(req.params.id);
    const property = await storage.getProperty(id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    res.json(property);
  });

  app.post(api.properties.create.path, async (req, res) => {
    try {
      const input = api.properties.create.input.parse(req.body);
      const property = await storage.createProperty(input);
      res.status(201).json(property);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.properties.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.properties.update.input.parse(req.body);
      const property = await storage.updateProperty(id, input);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.properties.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteProperty(id);
    res.status(204).end();
  });

  // -- NOTES --
  app.get(api.notes.list.path, async (req, res) => {
    const propertyId = Number(req.params.propertyId);
    const propertyNotes = await storage.getNotesByPropertyId(propertyId);
    res.json(propertyNotes);
  });

  app.post(api.notes.create.path, async (req, res) => {
    try {
      const propertyId = Number(req.params.propertyId);
      const input = api.notes.create.input.parse(req.body);
      const note = await storage.createNote(propertyId, input);
      res.status(201).json(note);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.notes.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteNote(id);
    res.status(204).end();
  });

  // -- EXPENSES --
  app.get(api.expenses.list.path, async (req, res) => {
    const propertyId = Number(req.params.propertyId);
    const propertyExpenses = await storage.getExpensesByPropertyId(propertyId);
    res.json(propertyExpenses);
  });

  app.post(api.expenses.create.path, async (req, res) => {
    try {
      const propertyId = Number(req.params.propertyId);
      const input = api.expenses.create.input.parse(req.body);
      const expense = await storage.createExpense(propertyId, input);
      res.status(201).json(expense);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.expenses.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteExpense(id);
    res.status(204).end();
  });

  // -- TASKS --
  app.get(api.tasks.list.path, async (req, res) => {
    const allTasks = await storage.getTasks();
    res.json(allTasks);
  });

  app.post(api.tasks.create.path, async (req, res) => {
    try {
      const input = api.tasks.create.input.parse(req.body);
      const task = await storage.createTask(input);
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.tasks.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.tasks.update.input.parse(req.body);
      const task = await storage.updateTask(id, input);
      if (!task) return res.status(404).json({ message: "Task not found" });
      res.json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.tasks.complete.path, async (req, res) => {
    const id = Number(req.params.id);
    const task = await storage.completeTask(id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  });

  app.delete(api.tasks.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteTask(id);
    res.status(204).end();
  });

  // SEED DATA
  async function seedDatabase() {
    const existingProperties = await storage.getProperties();
    if (existingProperties.length === 0) {
      const p1 = await storage.createProperty({
        name: "Sunset Villa",
        location: "123 Ocean Drive, CA",
        type: "House",
        rentAmount: 3500,
        isAgencyManaged: true,
        agencyFee: 350,
        status: "rented",
      });

      const p2 = await storage.createProperty({
        name: "Mountain Retreat",
        location: "45 Pine Ridge, CO",
        type: "Countryside House",
        rentAmount: 2800,
        isAgencyManaged: false,
        agencyFee: 0,
        status: "available",
      });

      await storage.createNote(p1.id, {
        content: "Tenant reported a leaky faucet in the main bathroom.",
      });

      await storage.createExpense(p1.id, {
        description: "Plumber visit for leaky faucet",
        amount: 150,
      });

      await storage.createNote(p2.id, {
        content: "Need to clear the driveway snow before showing the property.",
      });
    }
  }

  // Run seed
  seedDatabase().catch(console.error);

  return httpServer;
}
