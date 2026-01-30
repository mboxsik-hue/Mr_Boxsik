import { 
  items, cases, caseItems, userItems, profiles,
  type Item, type Case, type CaseItem, type UserItem, type Profile
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, inArray } from "drizzle-orm";
import { authStorage } from "./replit_integrations/auth/storage";

export interface IStorage {
  // Profiles
  getProfile(userId: string): Promise<Profile>;
  updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile>;
  
  // Cases & Items
  getCases(): Promise<(Case & { items: (Item & { chance: number })[] })[]>;
  getCase(id: number): Promise<(Case & { items: (Item & { chance: number })[] }) | undefined>;
  
  // Inventory
  getUserItems(userId: string): Promise<(UserItem & { item: Item })[]>;
  
  // Actions
  openCase(userId: string, caseId: number): Promise<{ item: Item, userItem: UserItem, balance: number, profile: Profile }>;
  sellItem(userId: string, userItemId: number): Promise<{ balance: number, soldAmount: number }>;
  sellAllItems(userId: string): Promise<{ balance: number, soldCount: number, totalAmount: number }>;
  
  // Seeding
  seedData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getProfile(userId: string): Promise<Profile> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    if (!profile) {
      // Create default profile with starting balance
      const [newProfile] = await db.insert(profiles).values({
        userId,
        balance: 10000, // Starting balance 100.00
      }).returning();
      return newProfile;
    }
    return profile;
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const [updated] = await db.update(profiles)
      .set(updates)
      .where(eq(profiles.userId, userId))
      .returning();
    return updated;
  }

  async getCases(): Promise<(Case & { items: (Item & { chance: number })[] })[]> {
    const allCases = await db.select().from(cases);
    const result = [];
    
    for (const c of allCases) {
      const itemsInCase = await db.select({
        item: items,
        chance: caseItems.chance
      })
      .from(caseItems)
      .innerJoin(items, eq(caseItems.itemId, items.id))
      .where(eq(caseItems.caseId, c.id));
      
      result.push({
        ...c,
        items: itemsInCase.map(r => ({ ...r.item, chance: r.chance }))
      });
    }
    
    return result;
  }

  async getCase(id: number): Promise<(Case & { items: (Item & { chance: number })[] }) | undefined> {
    const [c] = await db.select().from(cases).where(eq(cases.id, id));
    if (!c) return undefined;

    const itemsInCase = await db.select({
      item: items,
      chance: caseItems.chance
    })
    .from(caseItems)
    .innerJoin(items, eq(caseItems.itemId, items.id))
    .where(eq(caseItems.caseId, c.id));

    return {
      ...c,
      items: itemsInCase.map(r => ({ ...r.item, chance: r.chance }))
    };
  }

  async getUserItems(userId: string): Promise<(UserItem & { item: Item })[]> {
    const result = await db.select({
      userItem: userItems,
      item: items
    })
    .from(userItems)
    .innerJoin(items, eq(userItems.itemId, items.id))
    .where(
      sql`${userItems.userId} = ${userId} AND ${userItems.isSold} = false`
    );
    
    return result.map(r => ({ ...r.userItem, item: r.item }));
  }

  async openCase(userId: string, caseId: number): Promise<{ item: Item, userItem: UserItem, balance: number, profile: Profile }> {
    return await db.transaction(async (tx) => {
      // 1. Get Case Price
      const [c] = await tx.select().from(cases).where(eq(cases.id, caseId));
      if (!c) throw new Error("Case not found");

      // 2. Get Profile & Check Balance
      const [profile] = await tx.select().from(profiles).where(eq(profiles.userId, userId));
      if (!profile || profile.balance < c.price) {
        throw new Error("Insufficient funds");
      }

      // 3. Deduct Balance
      await tx.update(profiles)
        .set({ 
          balance: profile.balance - c.price,
          totalOpened: (profile.totalOpened || 0) + 1
        })
        .where(eq(profiles.userId, userId));

      // 4. Select Item (RNG)
      const caseItemsList = await tx.select({
        item: items,
        chance: caseItems.chance
      })
      .from(caseItems)
      .innerJoin(items, eq(caseItems.itemId, items.id))
      .where(eq(caseItems.caseId, caseId));

      let random = Math.random() * 100;
      let selectedItem = caseItemsList[0].item;
      let currentSum = 0;

      // Normalize chances if they don't sum to 100
      const totalChance = caseItemsList.reduce((acc, curr) => acc + curr.chance, 0);
      const multiplier = 100 / totalChance;

      for (const ci of caseItemsList) {
        currentSum += ci.chance * multiplier;
        if (random <= currentSum) {
          selectedItem = ci.item;
          break;
        }
      }

      // 5. Add to Inventory
      const [userItem] = await tx.insert(userItems).values({
        userId,
        itemId: selectedItem.id,
        isSold: false
      }).returning();

      // 6. Update Best Drop if applicable
      if (selectedItem.price > profile.bestDrop) {
        await tx.update(profiles)
          .set({ bestDrop: selectedItem.price })
          .where(eq(profiles.userId, userId));
      }
      
      const [updatedProfile] = await tx.select().from(profiles).where(eq(profiles.userId, userId));

      return { item: selectedItem, userItem, balance: updatedProfile.balance, profile: updatedProfile };
    });
  }

  async sellItem(userId: string, userItemId: number): Promise<{ balance: number, soldAmount: number }> {
    return await db.transaction(async (tx) => {
      // 1. Get User Item
      const [userItem] = await tx.select().from(userItems).where(eq(userItems.id, userItemId));
      if (!userItem || userItem.userId !== userId || userItem.isSold) {
        throw new Error("Item not found or already sold");
      }

      // 2. Get Item Value
      const [item] = await tx.select().from(items).where(eq(items.id, userItem.itemId));
      
      // 3. Update User Item
      await tx.update(userItems)
        .set({ isSold: true })
        .where(eq(userItems.id, userItemId));

      // 4. Add Balance
      const [profile] = await tx.select().from(profiles).where(eq(profiles.userId, userId));
      const [updatedProfile] = await tx.update(profiles)
        .set({ balance: profile.balance + item.price })
        .where(eq(profiles.userId, userId))
        .returning();

      return { balance: updatedProfile.balance, soldAmount: item.price };
    });
  }

  async sellAllItems(userId: string): Promise<{ balance: number, soldCount: number, totalAmount: number }> {
    return await db.transaction(async (tx) => {
      // 1. Get All Unsold Items
      const unsolds = await tx.select({
        id: userItems.id,
        price: items.price
      })
      .from(userItems)
      .innerJoin(items, eq(userItems.itemId, items.id))
      .where(sql`${userItems.userId} = ${userId} AND ${userItems.isSold} = false`);

      if (unsolds.length === 0) {
        const [profile] = await tx.select().from(profiles).where(eq(profiles.userId, userId));
        return { balance: profile.balance, soldCount: 0, totalAmount: 0 };
      }

      // 2. Calculate Total
      const totalAmount = unsolds.reduce((acc, curr) => acc + curr.price, 0);

      // 3. Mark All Sold
      await tx.update(userItems)
        .set({ isSold: true })
        .where(inArray(userItems.id, unsolds.map(u => u.id)));

      // 4. Update Balance
      const [profile] = await tx.select().from(profiles).where(eq(profiles.userId, userId));
      const [updatedProfile] = await tx.update(profiles)
        .set({ balance: profile.balance + totalAmount })
        .where(eq(profiles.userId, userId))
        .returning();

      return { balance: updatedProfile.balance, soldCount: unsolds.length, totalAmount };
    });
  }

  async seedData() {
    const existingCases = await db.select().from(cases);
    if (existingCases.length > 0) return;

    console.log("Seeding data...");

    // Create Items
    const createdItems = await db.insert(items).values([
      // Common
      { name: "P250 | Sand Dune", price: 10, image: "🥪", rarity: "common" },
      { name: "MP9 | Storm", price: 15, image: "🌪️", rarity: "common" },
      { name: "Nova | Polar Mesh", price: 12, image: "❄️", rarity: "common" },
      
      // Rare
      { name: "AWP | Pit Viper", price: 150, image: "🐍", rarity: "rare" },
      { name: "Glock-18 | Water Elemental", price: 300, image: "🌊", rarity: "rare" },
      
      // Epic
      { name: "AK-47 | Redline", price: 1200, image: "🔴", rarity: "epic" },
      { name: "M4A4 | Asiimov", price: 2500, image: "🤖", rarity: "epic" },
      { name: "USP-S | Kill Confirmed", price: 4000, image: "💀", rarity: "epic" },

      // Legendary
      { name: "Karambit | Fade", price: 50000, image: "🌈", rarity: "legendary" },
      { name: "AWP | Dragon Lore", price: 150000, image: "🐉", rarity: "legendary" },
      { name: "M9 Bayonet | Doppler", price: 45000, image: "💎", rarity: "legendary" },
      { name: "Butterfly Knife | Marble Fade", price: 80000, image: "🦋", rarity: "legendary" }
    ]).returning();

    // Create Cases
    const [caseCheap, caseMid, caseHigh] = await db.insert(cases).values([
      { name: "Bronze Case", price: 100, image: "📦", description: "Cheap and reliable" },
      { name: "Silver Case", price: 1000, image: "💼", description: "Good chance for profits" },
      { name: "Gold Case", price: 5000, image: "👑", description: "High risk, high reward" }
    ]).returning();

    // Link Items to Cases (Seed logic)
    // Bronze Case: Mostly common/rare
    await db.insert(caseItems).values([
      { caseId: caseCheap.id, itemId: createdItems[0].id, chance: 40 },
      { caseId: caseCheap.id, itemId: createdItems[1].id, chance: 40 },
      { caseId: caseCheap.id, itemId: createdItems[2].id, chance: 15 },
      { caseId: caseCheap.id, itemId: createdItems[3].id, chance: 4 },
      { caseId: caseCheap.id, itemId: createdItems[5].id, chance: 1 }, // 1% for AK Redline
    ]);

    // Silver Case: Mix
    await db.insert(caseItems).values([
      { caseId: caseMid.id, itemId: createdItems[3].id, chance: 30 },
      { caseId: caseMid.id, itemId: createdItems[4].id, chance: 30 },
      { caseId: caseMid.id, itemId: createdItems[5].id, chance: 20 },
      { caseId: caseMid.id, itemId: createdItems[6].id, chance: 15 },
      { caseId: caseMid.id, itemId: createdItems[8].id, chance: 5 }, // 5% for Karambit
    ]);

    // Gold Case: High tier
    await db.insert(caseItems).values([
      { caseId: caseHigh.id, itemId: createdItems[5].id, chance: 20 },
      { caseId: caseHigh.id, itemId: createdItems[6].id, chance: 20 },
      { caseId: caseHigh.id, itemId: createdItems[7].id, chance: 20 },
      { caseId: caseHigh.id, itemId: createdItems[8].id, chance: 15 },
      { caseId: caseHigh.id, itemId: createdItems[9].id, chance: 10 },
      { caseId: caseHigh.id, itemId: createdItems[10].id, chance: 10 },
      { caseId: caseHigh.id, itemId: createdItems[11].id, chance: 5 },
    ]);
  }
}

export const storage = new DatabaseStorage();
