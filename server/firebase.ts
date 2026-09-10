import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import crypto from "crypto";

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = crypto.scryptSync(process.env.JWT_SECRET || 'default_secret_key_123', 'salt', 32);

function encryptApiKey(apiKey: string): string {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.startsWith('enc:')) return apiKey;
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `enc:${iv.toString('hex')}:${encrypted}`;
  } catch(e) {
    console.error("Encryption error", e);
    return apiKey;
  }
}

function decryptApiKey(encryptedApiKey: string): string {
  if (!encryptedApiKey || typeof encryptedApiKey !== 'string' || !encryptedApiKey.startsWith('enc:')) return encryptedApiKey;
  try {
    const parts = encryptedApiKey.split(':');
    const iv = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption error', err);
    return encryptedApiKey;
  }
}

function traverseAndEncrypt(data: any): any {
  if (!data || typeof data !== 'object' || Buffer.isBuffer(data) || data instanceof Date) return data;
  if (Array.isArray(data)) return data.map(traverseAndEncrypt);
  const newData = { ...data };
  for (const key of Object.keys(newData)) {
    if (key === 'apiKey' && typeof newData[key] === 'string') {
      newData[key] = encryptApiKey(newData[key]);
    } else if (typeof newData[key] === 'object') {
      newData[key] = traverseAndEncrypt(newData[key]);
    }
  }
  return newData;
}

function traverseAndDecrypt(data: any): any {
  if (!data || typeof data !== 'object' || Buffer.isBuffer(data) || data instanceof Date) return data;
  if (Array.isArray(data)) return data.map(traverseAndDecrypt);
  const newData = { ...data };
  for (const key of Object.keys(newData)) {
    if (key === 'apiKey' && typeof newData[key] === 'string') {
      newData[key] = decryptApiKey(newData[key]);
    } else if (typeof newData[key] === 'object') {
      newData[key] = traverseAndDecrypt(newData[key]);
    }
  }
  return newData;
}


// Load environment variables
dotenv.config();

let projectId = process.env.FIREBASE_PROJECT_ID || "f4nrabot";

// Dynamic loading from firebase-applet-config.json
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
if (fs.existsSync(configPath)) {
  try {
    const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    if (configData.projectId && configData.projectId !== "remixed-project-id") {
      projectId = process.env.FIREBASE_PROJECT_ID || configData.projectId;
    }
  } catch (err) {
    console.error("Error reading firebase-applet-config.json:", err);
  }
}

const DEBUG = process.env.DEBUG === "true"; // false by default

// === FIRESTORE QUOTA GUARD & RAM CACHE CONFIGURATION ===
let isFirestoreSuspended = false;
let firestoreSuspendedUntil = 0;

function checkFirestoreSuspension() {
  const now = Date.now();
  if (isFirestoreSuspended) {
    if (now < firestoreSuspendedUntil) {
      const secondsLeft = Math.ceil((firestoreSuspendedUntil - now) / 1000);
      throw new Error(`[QuotaGuard] Firestore request suspended due to RESOURCE_EXHAUSTED. Silakan tunggu ${secondsLeft} detik lagi sebelum mencoba.`);
    } else {
      isFirestoreSuspended = false;
    }
  }
}

function handleQuotaError(err: any) {
  const message = err?.message || String(err);
  if (
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("Quota exceeded") ||
    message.includes("quota exceeded") ||
    message.includes("free daily read units") ||
    message.includes("free tier database")
  ) {
    if (!isFirestoreSuspended) {
      isFirestoreSuspended = true;
      firestoreSuspendedUntil = Date.now() + 5 * 60 * 1000; // Suspend selama 5 menit
      console.error(`\n==================================================\n[QuotaGuard] CRITICAL: FIREBASE INI TERKENA QUOTA EXCEEDED (RESOURCE_EXHAUSTED)!\nRequest Firestore ditunda selama 5 menit untuk menghemat kuota.\n==================================================\n`);
    }
  }
}

interface CacheEntry {
  data: any;
  timestamp: number;
  exists: boolean;
}

const docCache = new Map<string, CacheEntry>();

function getCacheTTL(fullPath: string): number {
  const lowerPath = fullPath.toLowerCase();
  
  // 1. configCache TTL 5–10 menit (kita pilih 5 menit)
  if (lowerPath.includes('/configs/main') || lowerPath.endsWith('/configs/main')) {
    return 5 * 60 * 1000;
  }
  
  // 2. profileCache TTL 5–10 menit (kita pilih 5 menit)
  // Format target: users/{uid} (tanpa subcollection berikutnya)
  const parts = fullPath.split('/');
  if (parts.length === 2 && parts[0] === 'users') {
    return 5 * 60 * 1000; // users/{uid}
  }
  
  // 3. contactsCache TTL 10 menit
  if (lowerPath.includes('/contacts/')) {
    return 10 * 60 * 1000;
  }
  
  return 0; // default no cache
}

function invalidateCache(fullPath: string) {
  if (docCache.has(fullPath)) {
    docCache.delete(fullPath);
    if (DEBUG) console.log(`[Firestore Cache Invalidated] ${fullPath}`);
  }
}

class SelfHealingFirestore {
  private activeDb: any = null;
  private isInitialized = false;

  constructor() {
    // Run validation immediately on boot (asynchronously to avoid blocking main process server port binding)
    this.runStartupValidation().catch((err) => {
      console.error("[FirebaseAdmin] Startup Validation failed:", err.message || err);
    });
  }

  public isLocalFallbackActive(): boolean {
    return false; // Local fallback disabled completely!
  }

  private async runStartupValidation() {
    console.log("[FirebaseAdmin] Initializing...");

    const serviceAccountEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const serviceAccountKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId) {
      console.error("[FirebaseAdmin] FIREBASE_PROJECT_ID is not configured.");
      return;
    }

    if (!serviceAccountEmail || !serviceAccountKey) {
      console.warn("[FirebaseAdmin] Credentials Missing: FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY are not present.");
      return;
    }

    console.log("[FirebaseAdmin] Credentials Found");

    // Key checking is deferred to getDb()

    try {
      const dbInstance = this.getDb();
      console.log("[FirebaseAdmin] Firestore Connected");

      // Verify connection & execute test write to users/system_test
      await dbInstance.collection("users").doc("system_test").set({
        timestamp: new Date().toISOString(),
        status: "OK",
        test_by: "FirebaseAdmin_Autocheck"
      });
      console.log("[FirebaseAdmin] Test Write Success: Registered system_test document in users collection");
    } catch (err: any) {
      console.error("[FirebaseAdmin] Connection or Test Write failed:", err.message || err);
      throw err;
    }
  }

  private getDb() {
    if (this.isInitialized && this.activeDb) {
      return this.activeDb;
    }

    try {
      if (admin.apps.length === 0) {
        const serviceAccountEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const serviceAccountKey = process.env.FIREBASE_PRIVATE_KEY;

        if (projectId && serviceAccountEmail && serviceAccountKey) {
          if (!serviceAccountKey.startsWith("-----BEGIN PRIVATE KEY-----")) {
            console.error("[FirebaseAdmin] Invalid FIREBASE_PRIVATE_KEY format");
            throw new Error("[FirebaseAdmin] Invalid FIREBASE_PRIVATE_KEY format");
          }

          let formattedPrivateKey = serviceAccountKey;
          if (formattedPrivateKey.startsWith('"') && formattedPrivateKey.endsWith('"')) {
            formattedPrivateKey = formattedPrivateKey.slice(1, -1);
          }
          formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: projectId,
              clientEmail: serviceAccountEmail,
              privateKey: formattedPrivateKey
            })
          });
          console.log("[FirebaseAdmin] App initialized successfully with Service Account.");
        } else {
          admin.initializeApp({
            projectId: projectId || undefined
          });
          console.log("[FirebaseAdmin] App initialized with default/ambient credential.");
        }
      }

      // Always use the default database, do not set databaseId
      this.activeDb = getFirestore();
      this.activeDb.settings({ ignoreUndefinedProperties: true });
      this.isInitialized = true;
      return this.activeDb;
    } catch (err: any) {
      console.error("[Firestore] FAILED to initialize Firestore Admin Instance:", err);
      throw err;
    }
  }

  public async testAndHeal() {
    try {
      checkFirestoreSuspension();
      const dbInstance = this.getDb();
      await dbInstance.collection('users').limit(1).get();
      if (DEBUG) console.log("SelfHealingFirestore: Successfully verified connection with cloud Firestore.");
    } catch (err: any) {
      handleQuotaError(err);
      console.error("[Firestore] Connection validation failed:", err.message || err);
      throw err;
    }
  }

  public batch() {
    checkFirestoreSuspension();
    const dbInstance = this.getDb();
    const adminBatch = dbInstance.batch();
    return {
      set(docRefWrapper: any, data: any, options?: any) {
        const rawRef = docRefWrapper && docRefWrapper._rawRef ? docRefWrapper._rawRef : docRefWrapper;
        if (options) {
          data = traverseAndEncrypt(data);
          return adminBatch.set(rawRef, data, options);
        }
        data = traverseAndEncrypt(data);
        return adminBatch.set(rawRef, data);
      },
      update(docRefWrapper: any, data: any) {
        const rawRef = docRefWrapper && docRefWrapper._rawRef ? docRefWrapper._rawRef : docRefWrapper;
        data = traverseAndEncrypt(data);
        return adminBatch.update(rawRef, data);
      },
      delete(docRefWrapper: any) {
        const rawRef = docRefWrapper && docRefWrapper._rawRef ? docRefWrapper._rawRef : docRefWrapper;
        return adminBatch.delete(rawRef);
      },
      async commit() {
        try {
          checkFirestoreSuspension();
          return await adminBatch.commit();
        } catch (err: any) {
          handleQuotaError(err);
          throw err;
        }
      }
    };
  }

  public collection(name: string) {
    const self = this;

    class FirestoreQuery {
      private filters: { field: string; op: string; value: any }[] = [];
      private orders: { field: string; direction?: string }[] = [];
      private limitCount?: number;

      constructor(
        filters?: { field: string; op: string; value: any }[],
        orders?: { field: string; direction?: string }[],
        limitCount?: number
      ) {
        if (filters) this.filters = [...filters];
        if (orders) this.orders = [...orders];
        if (limitCount !== undefined) this.limitCount = limitCount;
      }

      public where(field: string, op: string, value: any) {
        return new FirestoreQuery([...this.filters, { field, op, value }], this.orders, this.limitCount);
      }

      public orderBy(field: string, direction?: string) {
        return new FirestoreQuery(this.filters, [...this.orders, { field, direction }], this.limitCount);
      }

      public limit(count: number) {
        return new FirestoreQuery(this.filters, this.orders, count);
      }

      public async get() {
        try {
          checkFirestoreSuspension();
          const dbInstance = self.getDb();
          let query: any = dbInstance.collection(name);
          for (const filter of this.filters) {
            query = query.where(filter.field, filter.op, filter.value);
          }
          for (const order of this.orders) {
            query = query.orderBy(order.field, order.direction);
          }
          if (this.limitCount !== undefined) {
            query = query.limit(this.limitCount);
          }
          const snap = await query.get();
          const tempDocs = snap.docs.map((d: any) => {
            const decData = traverseAndDecrypt(d.data());
            return {
              id: d.id,
              ref: d.ref,
              data: () => decData,
              exists: d.exists
            };
          });
          const wrappedSnap = {
            docs: tempDocs,
            empty: snap.empty,
            size: snap.size,
            forEach: (cb: any) => tempDocs.forEach(cb)
          };
          return wrappedSnap;
        } catch (err: any) {
          handleQuotaError(err);
          console.error(`[Firestore] Read Failed: collection ${name}:`, err.message || err);
          throw err;
        }
      }
    }

    return {
      doc(id: string) {
        const fullPath = `${name}/${id}`;
        const dbInstance = self.getDb();
        const rawDocRef = dbInstance.collection(name).doc(id);
        return {
          _rawRef: rawDocRef,
          async get() {
            try {
              checkFirestoreSuspension();
              const ttl = getCacheTTL(fullPath);
              const now = Date.now();

              if (ttl > 0) {
                const cached = docCache.get(fullPath);
                if (cached && (now - cached.timestamp < ttl)) {
                  if (DEBUG) console.log(`[Firestore Cache Hit] ${fullPath}`);
                  return {
                    id: id,
                    exists: cached.exists,
                    data() {
                      return cached.data ? traverseAndDecrypt(JSON.parse(JSON.stringify(cached.data))) : undefined;
                    }
                  };
                }
              }

              const snap = await rawDocRef.get();

              if (ttl > 0) {
                const exists = snap.exists;
                const rawData = exists ? snap.data() : null;
                const data = traverseAndDecrypt(rawData);
                docCache.set(fullPath, {
                  data,
                  timestamp: now,
                  exists
                });
                if (DEBUG) console.log(`[Firestore Cache Store] ${fullPath} (TTL: ${ttl / 1000}s)`);
              }

              return snap;
            } catch (err: any) {
              handleQuotaError(err);
              console.error(`[Firestore] Read Failed: ${name}/${id}:`, err.message || err);
              throw err;
            }
          },
          async set(data: any, options?: any) {
              data = traverseAndEncrypt(data);
            try {
              checkFirestoreSuspension();
              invalidateCache(fullPath);

              const res = await rawDocRef.set(data, options);
              if (DEBUG) console.log(`[Firestore] Write Success: ${name}/${id}`);
              return res;
            } catch (err: any) {
              handleQuotaError(err);
              console.error(`[Firestore] Write Failed: ${name}/${id}:`, err.message || err);
              throw err;
            }
          },
          async update(data: any) {
              data = traverseAndEncrypt(data);
            try {
              checkFirestoreSuspension();
              invalidateCache(fullPath);

              const res = await rawDocRef.update(data);
              if (DEBUG) console.log(`[Firestore] Write Success: ${name}/${id}`);
              return res;
            } catch (err: any) {
              handleQuotaError(err);
              console.error(`[Firestore] Write Failed: ${name}/${id}:`, err.message || err);
              throw err;
            }
          },
          async delete() {
            try {
              checkFirestoreSuspension();
              invalidateCache(fullPath);

              const res = await rawDocRef.delete();
              if (DEBUG) console.log(`[Firestore] Write Success: ${name}/${id}`);
              return res;
            } catch (err: any) {
              handleQuotaError(err);
              console.error(`[Firestore] Write Failed: ${name}/${id}:`, err.message || err);
              throw err;
            }
          }
        };
      },
      where(field: string, op: string, value: any) {
        return new FirestoreQuery().where(field, op, value);
      },
      orderBy(field: string, direction?: string) {
        return new FirestoreQuery().orderBy(field, direction);
      },
      limit(count: number) {
        return new FirestoreQuery().limit(count);
      },
      async get() {
        return new FirestoreQuery().get();
      }
    };
  }
}

export const db: any = new SelfHealingFirestore();
