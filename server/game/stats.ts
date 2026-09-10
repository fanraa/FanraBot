import { MemberProfile } from "../types";

export interface RpgItem {
  id: string;
  name: string;
  type: 'head' | 'body' | 'legs' | 'feet' | 'weapon';
  price?: number;
  stats: {
    hp?: number;
    atk?: number;
    def?: number;
    spd?: number;
  };
}

export const RPG_ITEMS: Record<string, RpgItem> = {
  // WEAPONS (Sword - ATK focus)
  'wooden_sword': { id: 'wooden_sword', name: 'Wooden Sword', type: 'weapon', price: 100, stats: { atk: 5 } },
  'iron_sword': { id: 'iron_sword', name: 'Iron Sword', type: 'weapon', price: 500, stats: { atk: 15 } },
  'steel_sword': { id: 'steel_sword', name: 'Steel Sword', type: 'weapon', price: 1500, stats: { atk: 40 } },
  
  // WEAPONS (Bow - SPD focus)
  'short_bow': { id: 'short_bow', name: 'Short Bow', type: 'weapon', price: 100, stats: { spd: 5 } },
  'hunter_bow': { id: 'hunter_bow', name: 'Hunter Bow', type: 'weapon', price: 500, stats: { spd: 15 } },
  'composite_bow': { id: 'composite_bow', name: 'Composite Bow', type: 'weapon', price: 1500, stats: { spd: 40 } },

  // ARMOR / BODY (Available in Shop)
  'leather_armor': { id: 'leather_armor', name: 'Leather Armor', type: 'body', price: 200, stats: { def: 5, hp: 20 } },
  'iron_armor': { id: 'iron_armor', name: 'Iron Armor', type: 'body', price: 750, stats: { def: 15, hp: 60 } },
  'steel_armor': { id: 'steel_armor', name: 'Steel Armor', type: 'body', price: 2000, stats: { def: 45, hp: 150 } },

  // HELMET (Head - Rare Drop Only)
  'leather_helmet': { id: 'leather_helmet', name: 'Leather Helmet', type: 'head', stats: { def: 2, hp: 10 } },
  'iron_helmet': { id: 'iron_helmet', name: 'Iron Helmet', type: 'head', stats: { def: 6, hp: 25 } },
  'steel_helmet': { id: 'steel_helmet', name: 'Steel Helmet', type: 'head', stats: { def: 15, hp: 50 } },
  'dragon_helmet': { id: 'dragon_helmet', name: 'Dragon Helmet (Legendary)', type: 'head', stats: { def: 25, hp: 100, atk: 5 } },

  // PANTS (Legs - Rare Drop Only)
  'leather_pants': { id: 'leather_pants', name: 'Leather Pants', type: 'legs', stats: { def: 3, hp: 15 } },
  'iron_pants': { id: 'iron_pants', name: 'Iron Pants', type: 'legs', stats: { def: 8, hp: 35 } },
  'steel_pants': { id: 'steel_pants', name: 'Steel Pants', type: 'legs', stats: { def: 20, hp: 70 } },
  'dragon_pants': { id: 'dragon_pants', name: 'Dragon Pants (Legendary)', type: 'legs', stats: { def: 35, hp: 120 } },

  // BOOTS (Feet - Rare Drop Only)
  'leather_boots': { id: 'leather_boots', name: 'Leather Boots', type: 'feet', stats: { def: 2, hp: 8, spd: 3 } },
  'iron_boots': { id: 'iron_boots', name: 'Iron Boots', type: 'feet', stats: { def: 5, hp: 20, spd: 8 } },
  'steel_boots': { id: 'steel_boots', name: 'Steel Boots', type: 'feet', stats: { def: 12, hp: 45, spd: 15 } },
  'shadow_boots': { id: 'shadow_boots', name: 'Shadow Boots (Legendary)', type: 'feet', stats: { def: 18, hp: 60, spd: 30 } },
};

export const SHOP_ITEMS = [
  'wooden_sword', 'short_bow',
  'iron_sword', 'hunter_bow',
  'steel_sword', 'composite_bow',
  'leather_armor', 'iron_armor', 'steel_armor'
];

/**
 * Calculates absolute player stats including level modifiers and equipped gear stats
 */
export function calculateStats(profile: any) {
  // Ensure profile properties exist
  const level = profile.rpgLevel || 1;
  const hpBase = 100 + (level - 1) * 15;
  const atkBase = 10 + (level - 1) * 3;
  const defBase = 0 + (level - 1) * 1;
  const spdBase = 10 + (level - 1) * 2;

  let hp = hpBase;
  let atk = atkBase;
  let def = defBase;
  let spd = spdBase;

  const gear = profile.rpgGear || {};
  const slots: ('head' | 'body' | 'legs' | 'feet' | 'weapon')[] = ['head', 'body', 'legs', 'feet', 'weapon'];
  
  for (const slot of slots) {
    const itemId = gear[slot];
    if (itemId && RPG_ITEMS[itemId]) {
      const item = RPG_ITEMS[itemId];
      if (item.stats.hp) hp += item.stats.hp;
      if (item.stats.atk) atk += item.stats.atk;
      if (item.stats.def) def += item.stats.def;
      if (item.stats.spd) spd += item.stats.spd;
    }
  }

  return { hp, atk, def, spd };
}

/**
 * Handles experience addition and level checks
 */
export function addXp(profile: any, amount: number) {
  profile.rpgXp = (profile.rpgXp || 0) + amount;
  const oldLevel = profile.rpgLevel || 1;
  let currentLevel = oldLevel;
  let leveledUp = false;

  while (true) {
    // 100 XP per level requirement scale (e.g. Lvl 1->2 needs 100xp, Lvl 2->3 needs 200xp, etc.)
    const needed = currentLevel * 100;
    if (profile.rpgXp >= needed) {
      profile.rpgXp -= needed;
      currentLevel += 1;
      leveledUp = true;
    } else {
      break;
    }
  }

  if (leveledUp) {
    profile.rpgLevel = currentLevel;
  }

  return { leveledUp, oldLevel, newLevel: currentLevel };
}

/**
 * Handle game item purchase
 */
export function buyItem(profile: any, itemId: string): { success: boolean; message: string; cost?: number } {
  const item = RPG_ITEMS[itemId];
  if (!item) {
    return { success: false, message: "⚠️ Item doesn't exist in our item directory!" };
  }
  if (item.price === undefined) {
    return { success: false, message: "⚠️ This item is highly rare and cannot be purchased in the shop!" };
  }

  profile.rpgCoins = profile.rpgCoins ?? 100;
  if (profile.rpgCoins < item.price) {
    return { 
      success: false, 
      message: `⚠️ Lack of funds! You need *${item.price}* Coins, but you only have *${profile.rpgCoins}*.` 
    };
  }

  if (!profile.rpgInventory) profile.rpgInventory = [];
  
  // Prevent buying duplicate unique weapon or body armor if already owned/equipped to save inventory clutter
  if (profile.rpgInventory.includes(itemId)) {
    return { success: false, message: `⚠️ You already own *${item.name}* in your inventory!` };
  }

  profile.rpgCoins -= item.price;
  profile.rpgInventory.push(itemId);
  return { 
    success: true, 
    message: `🎉 Successfully purchased *${item.name}* for 🪙 ${item.price} Coins!`, 
    cost: item.price 
  };
}

/**
 * Equip an item from inventory
 */
export function equipItem(profile: any, itemId: string): { success: boolean; message: string } {
  if (!profile.rpgInventory || !profile.rpgInventory.includes(itemId)) {
    return { success: false, message: "⚠️ You do not own this item in your inventory!" };
  }

  const item = RPG_ITEMS[itemId];
  if (!item) {
    return { success: false, message: "⚠️ Item not found in database!" };
  }

  if (!profile.rpgGear) profile.rpgGear = {};
  profile.rpgGear[item.type] = itemId;

  return { success: true, message: `🛡️ Equipped *${item.name}* to slots: *${item.type.toUpperCase()}*!` };
}

/**
 * Simulates a detailed turn-based fight between two combatants
 */
export function simulateBattle(
  challengerName: string,
  challengerStats: { hp: number; atk: number; def: number; spd: number },
  defenderName: string,
  defenderStats: { hp: number; atk: number; def: number; spd: number }
) {
  const logs: string[] = [];
  let hpA = challengerStats.hp;
  let hpB = defenderStats.hp;

  logs.push(`🤺 *${challengerName}* (HP ${hpA}/ATK ${challengerStats.atk}/DEF ${challengerStats.def}) VS *${defenderName}* (HP ${hpB}/ATK ${defenderStats.atk}/DEF ${defenderStats.def})`);

  let round = 1;
  const maxRounds = 30;

  // Determine who attacks first based on SPD
  const chalSpd = challengerStats.spd;
  const defSpd = defenderStats.spd;
  let challengerFirst = chalSpd >= defSpd;

  while (hpA > 0 && hpB > 0 && round <= maxRounds) {
    logs.push(`\n*── ROUND ${round} ──*`);
    
    if (challengerFirst) {
      // Challenger attacks first
      const rawDmgA = Math.max(2, challengerStats.atk - defenderStats.def);
      const varDmgA = Math.max(1, Math.round(rawDmgA * (0.85 + Math.random() * 0.3)));
      hpB -= varDmgA;
      logs.push(`⚡ *${challengerName}* strikes! Inflicted 💥 *${varDmgA}* DMG to *${defenderName}*`);
      
      if (hpB <= 0) {
        logs.push(`💀 *${defenderName}* collapsed under the heavy impact!`);
        break;
      }

      // Defender counter-attacks
      const rawDmgB = Math.max(2, defenderStats.atk - challengerStats.def);
      const varDmgB = Math.max(1, Math.round(rawDmgB * (0.85 + Math.random() * 0.3)));
      hpA -= varDmgB;
      logs.push(`💥 *${defenderName}* counters! Inflicted ⚡ *${varDmgB}* DMG to *${challengerName}*`);
      
      if (hpA <= 0) {
        logs.push(`💀 *${challengerName}* collapsed under the heavy impact!`);
        break;
      }
    } else {
      // Defender attacks first
      const rawDmgB = Math.max(2, defenderStats.atk - challengerStats.def);
      const varDmgB = Math.max(1, Math.round(rawDmgB * (0.85 + Math.random() * 0.3)));
      hpA -= varDmgB;
      logs.push(`⚡ *${defenderName}* strikes first! Inflicted 💥 *${varDmgB}* DMG to *${challengerName}*`);
      
      if (hpA <= 0) {
        logs.push(`💀 *${challengerName}* collapsed!`);
        break;
      }

      // Challenger counter-attacks
      const rawDmgA = Math.max(2, challengerStats.atk - defenderStats.def);
      const varDmgA = Math.max(1, Math.round(rawDmgA * (0.85 + Math.random() * 0.3)));
      hpB -= varDmgA;
      logs.push(`💥 *${challengerName}* strikes back! Inflicted ⚡ *${varDmgA}* DMG to *${defenderName}*`);
      
      if (hpB <= 0) {
        logs.push(`💀 *${defenderName}* collapsed!`);
        break;
      }
    }

    round++;
  }

  // Handle draw
  if (round > maxRounds && hpA > 0 && hpB > 0) {
    logs.push(`\n⏳ *TIMEOUT:* The match lasted too long and reached a draw!`);
  }

  const winner = hpA > 0 && hpB <= 0 ? 'challenger' : (hpB > 0 && hpA <= 0 ? 'defender' : 'draw');

  return {
    winner,
    logs,
    remainingHpA: Math.max(0, hpA),
    remainingHpB: Math.max(0, hpB)
  };
}

/**
 * Generate a random rare loot drop based on current Tower floor completed
 */
export function drawRareLoot(floor: number): string | null {
  const roll = Math.random();
  // 15% chance to get loot
  if (roll > 0.15) {
    return null;
  }

  let lootPool: string[] = [];

  if (floor === 100) {
    // Legendary boss guarantees a drop from the absolute highest tier
    lootPool = ['dragon_helmet', 'dragon_pants', 'shadow_boots'];
  } else if (floor >= 80) {
    lootPool = [
      'steel_helmet', 'steel_pants', 'steel_boots',
      'dragon_helmet', 'dragon_pants', 'shadow_boots'
    ];
  } else if (floor >= 50) {
    lootPool = ['steel_helmet', 'steel_pants', 'steel_boots', 'iron_helmet', 'iron_pants', 'iron_boots'];
  } else if (floor >= 25) {
    lootPool = ['iron_helmet', 'iron_pants', 'iron_boots', 'leather_helmet', 'leather_pants', 'leather_boots'];
  } else {
    lootPool = ['leather_helmet', 'leather_pants', 'leather_boots'];
  }

  const randomIndex = Math.floor(Math.random() * lootPool.length);
  return lootPool[randomIndex];
}

/**
 * Returns boss configurations for tower floors (every 10th floor has a distinctive boss)
 */
export function getBossForFloor(floor: number) {
  if (floor % 10 !== 0) return null;

  const bosses: Record<number, { name: string; hp: number; atk: number; def: number; spd: number; rewardCoins: number }> = {
    10: { name: '👾 Mega Slime King', hp: 120, atk: 12, def: 2, spd: 8, rewardCoins: 80 },
    20: { name: '🧟 Goblin Commander', hp: 220, atk: 22, def: 6, spd: 15, rewardCoins: 160 },
    30: { name: '🐍 Giant Basilisk', hp: 350, atk: 35, def: 12, spd: 22, rewardCoins: 300 },
    40: { name: '🛡️ Ancient Golem', hp: 600, atk: 45, def: 35, spd: 5, rewardCoins: 500 },
    50: { name: '🔥 Infernal Phoenix', hp: 800, atk: 75, def: 20, spd: 45, rewardCoins: 800 },
    60: { name: '🐺 Shadow Wolf Lord', hp: 1200, atk: 110, def: 35, spd: 90, rewardCoins: 1200 },
    70: { name: '💀 Arch-Necromancer', hp: 1800, atk: 150, def: 50, spd: 70, rewardCoins: 1800 },
    80: { name: '⚡ Thunder Chimera', hp: 2800, atk: 220, def: 75, spd: 120, rewardCoins: 2500 },
    90: { name: '👹 Abyssal Overlord', hp: 4500, atk: 350, def: 110, spd: 100, rewardCoins: 4000 },
    100: { name: '🐉 Ouroboros (Apocalypse Dragon)', hp: 99999, atk: 1200, def: 500, spd: 300, rewardCoins: 10000 },
  };

  return bosses[floor] || {
    name: `👹 Tier Boss Floor ${floor}`,
    hp: floor * 50,
    atk: floor * 4,
    def: Math.floor(floor * 1.2),
    spd: Math.floor(floor * 1.1),
    rewardCoins: floor * 50
  };
}

export interface RaidBoss {
  name: string;
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  rewardCoins: number;
  rewardXp: number;
  contributors: Record<string, { name: string; damage: number }>;
  expiresAt: number;
}

const RAID_BOSS_TEMPLATES = [
  { name: "🐉 Ancient Obsidian Wyrm", maxHp: 3000, atk: 45, def: 15, rewardCoins: 1500, rewardXp: 1000 },
  { name: "⚡ Storm Lord Titan", maxHp: 2500, atk: 55, def: 10, rewardCoins: 1800, rewardXp: 1200 },
  { name: "🔥 Lord of the Abyssal Void", maxHp: 4000, atk: 35, def: 25, rewardCoins: 2000, rewardXp: 1500 },
  { name: "🧟 Colossus of Undead Despair", maxHp: 5000, atk: 30, def: 20, rewardCoins: 2200, rewardXp: 1800 },
  { name: "👾 Interstellar Void Devourer", maxHp: 3500, atk: 60, def: 18, rewardCoins: 2500, rewardXp: 2000 }
];

/**
 * Returns the active in-memory raid boss, or spawns a new one if expired or dead
 */
export function getOrSpawnRaidBoss(forceNew = false): RaidBoss {
  const g = globalThis as any;
  const now = Date.now();

  // If already spawned, non-expired, and alive, return it
  if (!forceNew && g.currentRaidBoss && g.currentRaidBoss.hp > 0 && now < g.currentRaidBoss.expiresAt) {
    return g.currentRaidBoss;
  }

  // Otherwise, spawn a new template
  const randTemplate = RAID_BOSS_TEMPLATES[Math.floor(Math.random() * RAID_BOSS_TEMPLATES.length)];
  
  // Scale boss stats based on hours since epic battles started to keep it interesting
  const freshBoss: RaidBoss = {
    name: randTemplate.name,
    maxHp: randTemplate.maxHp,
    hp: randTemplate.maxHp,
    atk: randTemplate.atk,
    def: randTemplate.def,
    rewardCoins: randTemplate.rewardCoins,
    rewardXp: randTemplate.rewardXp,
    contributors: {},
    expiresAt: now + 3600000 // Spawns for 1 Hour precisely
  };

  g.currentRaidBoss = freshBoss;
  return freshBoss;
}

/**
 * Combat round simulation against the collective Raid Boss of the hour
 */
export function simulateRaidAttack(profile: any, boss: RaidBoss) {
  const stats = calculateStats(profile);
  let playerHp = stats.hp;
  let totalDmgDone = 0;
  const combatLogs: string[] = [];

  for (let r = 1; r <= 5; r++) {
    // Player hits boss
    const basePlayerDmg = Math.max(4, stats.atk - boss.def);
    const varPlayerDmg = Math.max(1, Math.round(basePlayerDmg * (0.85 + Math.random() * 0.3)));
    
    totalDmgDone += varPlayerDmg;

    // Boss hits player
    const baseBossDmg = Math.max(6, boss.atk - stats.def);
    const varBossDmg = Math.max(1, Math.round(baseBossDmg * (0.85 + Math.random() * 0.3)));
    playerHp -= varBossDmg;

    if (playerHp <= 0) {
      combatLogs.push(`Round ${r}: Dealt 💥 *${varPlayerDmg}* DMG but collapsed under the Boss's retaliating punch!`);
      break;
    } else {
      combatLogs.push(`Round ${r}: Dealt 💥 *${varPlayerDmg}* DMG (Your Remaining HP: *${playerHp}*)`);
    }
  }

  return { totalDmgDone, combatLogs };
}

