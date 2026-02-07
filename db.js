// db.js - Módulo de banco de dados KV (Upstash Redis / Local)
const { Redis } = require('@upstash/redis');

// Store local para desenvolvimento (dados em memória)
class LocalStore {
  constructor() {
    this.data = new Map();
  }
  async get(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  }
  async set(key, value) {
    this.data.set(key, value);
    return 'OK';
  }
  async del(key) {
    return this.data.delete(key) ? 1 : 0;
  }
  async keys(pattern) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return [...this.data.keys()].filter(k => regex.test(k));
  }
  async ping() {
    return 'PONG';
  }
}

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

let redis;
let isRemote = false;

if (url && token) {
  redis = new Redis({ url, token });
  isRemote = true;
  console.log('✅ Usando Upstash Redis:', url.substring(0, 30) + '...');
} else {
  redis = new LocalStore();
  console.log('📝 Usando store local (dados não persistem entre reinícios)');
}

// API do módulo
// IMPORTANTE: NÃO use JSON.stringify/JSON.parse ao usar estas funções.
// O Upstash auto-serializa objetos e auto-deserializa na leitura.
const db = {
  isRemote,

  async get(key) {
    try {
      const result = await redis.get(key);
      if (result === null || result === undefined) return null;
      return result;
    } catch (err) {
      console.error(`[DB] Erro get("${key}"):`, err.message);
      return null;
    }
  },

  async set(key, value) {
    try {
      return await redis.set(key, value);
    } catch (err) {
      console.error(`[DB] Erro set("${key}"):`, err.message);
      throw err;
    }
  },

  async del(key) {
    try {
      return await redis.del(key);
    } catch (err) {
      console.error(`[DB] Erro del("${key}"):`, err.message);
      throw err;
    }
  },

  async keys(pattern) {
    try {
      const result = await redis.keys(pattern);
      return Array.isArray(result) ? result : [];
    } catch (err) {
      console.error(`[DB] Erro keys("${pattern}"):`, err.message);
      return [];
    }
  },

  async ping() {
    try {
      if (isRemote) {
        await redis.ping();
      }
      return true;
    } catch (err) {
      console.error('[DB] Ping falhou:', err.message);
      return false;
    }
  }
};

module.exports = db;
