// Módulo de banco de dados - compatível com desenvolvimento local e Vercel
const { kv } = require('@vercel/kv');

// Simulador de KV para desenvolvimento local (quando não tiver variáveis do Vercel)
class LocalKVSimulator {
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
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
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

// Usar KV real no Vercel ou simulador local
const isVercel = process.env.KV_REST_API_URL;
const db = isVercel ? kv : new LocalKVSimulator();

console.log(isVercel ? '✅ Usando Vercel KV (produção)' : '📝 Usando KV local (desenvolvimento)');

module.exports = db;
