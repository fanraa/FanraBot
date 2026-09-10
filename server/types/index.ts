export interface MenfessSession {
  partnerJid: string;
  isSender: boolean;
  expiry: number;
}

export interface MultiPdfSession {
  images: Buffer[];
  timer?: NodeJS.Timeout;
}

export interface RecentUserImg {
  target: any; // The `imageMessage` object
  timestamp: number;
}

export interface ScheduledMenfessItem {
  id: string;
  from: string;
  targetJid: string;
  message: string;
  imgBuffer: Buffer | null;
  deliverAt: number;
}

export interface BufferedMessage {
  msg: any;
  text: string;
  isPureAggressiveResponse?: boolean;
}

export interface ChatBuffer {
  messages: BufferedMessage[];
  timer: NodeJS.Timeout | null;
  startTime: number;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderNumber: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  modelUsed?: string;
  createdAt?: number;
}

export interface ChatSession {
  id: string;
  contactName: string;
  contactNumber: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  messages: ChatMessage[];
  aiEnabled: boolean;
  muted?: boolean;
  lastMessageAt?: number;
  profilePictureUrl?: string;
  memorySummary?: string;
}

export interface ContactWriteCacheEntry {
  lastPayloadJson: string;
  lastWriteTime: number;
}

export interface DailyStats {
  pesan: number;
  tokens: number;
  geminiTokens: number;
  geminiCount: number;
  groqTokens: number;
  groqCount: number;
  openaiTokens: number;
  openaiCount: number;
  claudeTokens: number;
  claudeCount: number;
  deepseekTokens: number;
  deepseekCount: number;
  kimiTokens: number;
  kimiCount: number;
}

export interface AnalyticsData {
  pesanTerkirim: number;
  aiRespons: number;
  kontakBaru: number;
  totalResponTimeSec: number;
  totalResponCount: number;
  uniqueJids: string[];
  mediaDiproses?: number;
  downloaderHariIni?: number;
  linkDiblokir?: number;
  aiUsage?: {
    [providerOrModel: string]: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      requestCount: number;
      lastUsedAt: string;
      active?: boolean;
    };
  };
  dailyHistory?: {
    [dateStr: string]: DailyStats;
  };
  lastResetDate?: string;
}

export interface MemberProfile {
  id: string; // sender JID
  phone: string;
  name: string;
  points: number;
  joinedAt: string; // ISO string
  totalMessages: number;
  totalAIRequests: number;
  dailyAIUsage: number;
  dailyToolUsage: number;
  dailyOcrUsage?: number;
  dailyStickerUsage?: number;
  dailyHdUsage?: number;
  dailyDownloadUsage?: number;
  lastInteraction: string; // ISO string
  status: "active" | "inactive" | "premium";
  level: number;
  lastResetDate?: string;
  warnings?: number;
  spamWarnings?: number;
  badwordWarnings?: number;
  linkWarnings?: number;

  // RPG statistics fields
  rpgLevel?: number;
  rpgXp?: number;
  rpgCoins?: number;
  rpgTowerFloor?: number;
  rpgGear?: {
    head?: string;
    body?: string;
    legs?: string;
    feet?: string;
    weapon?: string;
  };
  rpgInventory?: string[];
}

export interface LogsCacheItem {
  timestamp: number;
  data: any[];
}