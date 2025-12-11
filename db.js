// Módulo de banco de dados - compatível com desenvolvimento local e Vercel
const { Redis } = require('@upstash/redis');

// Simulador de Redis para desenvolvimento local (quando não tiver variáveis do Upstash)
class LocalRedisSimulator {
  constructor() {
    this.data = new Map();
  }

  async get(key) {
    return this.data.get(key) || null;
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
    return Array.from(this.data.keys()).filter(key => regex.test(key));
  }

  async hgetall(key) {
    return this.data.get(key) || {};
  }

  async hset(key, field, value) {
    const hash = this.data.get(key) || {};
    hash[field] = value;
    this.data.set(key, hash);
    return 1;
  }

  async hdel(key, field) {
    const hash = this.data.get(key);
    if (hash && field in hash) {
      delete hash[field];
      return 1;
    }
    return 0;
  }
}

// Criar conexão com Upstash Redis ou usar simulador local
let db;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  // Produção: usar Upstash Redis
  db = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  console.log('✅ Usando Upstash Redis (produção)');
} else {
  // Desenvolvimento: usar simulador local
  db = new LocalRedisSimulator();
  console.log('📝 Usando Redis local (desenvolvimento)');
}

module.exports = db;
