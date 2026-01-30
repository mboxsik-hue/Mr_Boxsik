import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { isAuthenticated } from "./replit_integrations/auth/replitAuth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);

  // Seed Data
  await storage.seedData();

  // API Routes

  // Cases List
  app.get(api.cases.list.path, async (req, res) => {
    const cases = await storage.getCases();
    res.json(cases);
  });

  // Case Detail
  app.get(api.cases.get.path, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    const c = await storage.getCase(id);
    if (!c) return res.status(404).json({ message: "Case not found" });
    
    res.json(c);
  });

  // Open Case (Protected)
  app.post(api.cases.open.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any).claims.sub;
      
      const result = await storage.openCase(userId, id);
      res.json(result);
    } catch (e: any) {
      if (e.message === "Insufficient funds") {
        return res.status(400).json({ message: "Insufficient funds" });
      }
      if (e.message === "Case not found") {
        return res.status(404).json({ message: "Case not found" });
      }
      console.error(e);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Inventory List (Protected)
  app.get(api.inventory.list.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const items = await storage.getUserItems(userId);
    res.json(items);
  });

  // Sell Item (Protected)
  app.post(api.inventory.sell.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any).claims.sub;
      
      const result = await storage.sellItem(userId, id);
      res.json(result);
    } catch (e: any) {
      if (e.message === "Item not found or already sold") {
        return res.status(404).json({ message: "Item not found" });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Sell All (Protected)
  app.post(api.inventory.sellAll.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const result = await storage.sellAllItems(userId);
    res.json(result);
  });

  // Profile (Protected)
  app.get(api.profile.get.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const profile = await storage.getProfile(userId);
    res.json(profile);
  });

  return httpServer;
}
