// Script para migrar dados do SQLite para Vercel KV
require('dotenv').config();

const Database = require('better-sqlite3');
const db = require('./db');

async function migrate() {
  console.log('🔄 Iniciando migração de SQLite para KV...\n');

  try {
    const sqlite = new Database('database.db');

    // Migrar tarefas
    console.log('📋 Migrando tarefas...');
    const tasks = sqlite.prepare('SELECT * FROM tasks').all();

    for (const task of tasks) {
      await db.set(`task:${task.id}`, JSON.stringify(task));
      console.log(`  ✓ Tarefa ${task.id}: ${task.title}`);
    }

    // Atualizar contador de tarefas
    if (tasks.length > 0) {
      const maxId = Math.max(...tasks.map(t => t.id));
      await db.set('task:counter', maxId);
      console.log(`  ✓ Contador de tarefas: ${maxId}\n`);
    }

    // Migrar histórico de hábitos
    console.log('📊 Migrando histórico de hábitos...');
    const habits = sqlite.prepare('SELECT * FROM daily_habits_history').all();

    for (const habit of habits) {
      const key = `habit_history:${habit.date}:${habit.habit_name}`;
      const value = {
        date: habit.date,
        habitName: habit.habit_name,
        completed: habit.completed === 1,
        created_at: habit.created_at
      };
      await db.set(key, JSON.stringify(value));
      console.log(`  ✓ Hábito: ${habit.date} - ${habit.habit_name}`);
    }

    sqlite.close();

    console.log('\n✅ Migração concluída com sucesso!');
    console.log(`\nResumo:`);
    console.log(`  - ${tasks.length} tarefas migradas`);
    console.log(`  - ${habits.length} registros de hábitos migrados`);
  } catch (error) {
    console.error('\n❌ Erro durante a migração:', error);
    process.exit(1);
  }
}

migrate();
