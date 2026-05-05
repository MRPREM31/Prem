const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const dbPromise = open({
  filename: path.join(__dirname, 'database.sqlite'),
  driver: sqlite3.Database
});

async function setupDatabase() {
  const db = await dbPromise;
  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      date TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      tags TEXT NOT NULL,
      link TEXT,
      github TEXT
    );
    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      image TEXT NOT NULL
    );
  `);
  
  try {
    // Check if pptLink column exists, if not it will throw an error and we add it
    const columns = await db.all("PRAGMA table_info(projects)");
    const hasPptLink = columns.some(col => col.name === 'pptLink');
    if (!hasPptLink) {
      await db.exec("ALTER TABLE projects ADD COLUMN pptLink TEXT");
      console.log("Added pptLink column to projects table");
    }
  } catch (err) {
    console.error("Error updating schema:", err);
  }
  
  // Insert default settings if not exists
  await db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', ['profileImage', '/assets/profile.jpg']);
  await db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', ['resumeUrl', '/resume.pdf']);
  await db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', ['faviconUrl', '/vite.svg']);
  
  console.log("Database initialized");
}

module.exports = { dbPromise, setupDatabase };
