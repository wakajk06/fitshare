import { getDb } from './db.js';

export default async function handler(req, res) {
  const sql = getDb();
  if (!sql) {
    return res.status(503).json({
      error: 'Database not connected. Please run `npx vercel env pull .env.local` or set DATABASE_URL.',
    });
  }

  // Ensure users table exists
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at BIGINT NOT NULL
      );
    `;
  } catch (err) {
    console.error('User table init error:', err);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.query;
  const { name, username, password } = req.body || {};

  // POST /api/auth?action=signup
  if (action === 'signup') {
    if (!name || !username || !password) {
      return res.status(400).json({ error: 'Please fill out all required fields.' });
    }

    const cleanUsername = username.trim().toLowerCase();

    try {
      const existing = await sql`
        SELECT id FROM users WHERE LOWER(username) = ${cleanUsername}
      `;

      if (existing.length > 0) {
        return res.status(409).json({ error: 'That username is already taken. Please try another.' });
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const createdAt = Date.now();

      await sql`
        INSERT INTO users (id, name, username, password, created_at)
        VALUES (${id}, ${name.trim()}, ${cleanUsername}, ${password}, ${createdAt})
      `;

      return res.status(201).json({
        id,
        name: name.trim(),
        username: cleanUsername,
        createdAt,
      });
    } catch (error) {
      console.error('Signup error:', error);
      return res.status(500).json({ error: 'Failed to create user account' });
    }
  }

  // POST /api/auth?action=login
  if (action === 'login') {
    if (!username || !password) {
      return res.status(400).json({ error: 'Please enter username and password.' });
    }

    const cleanUsername = username.trim().toLowerCase();

    try {
      const users = await sql`
        SELECT id, name, username, password, created_at 
        FROM users 
        WHERE LOWER(username) = ${cleanUsername}
      `;

      if (users.length === 0 || users[0].password !== password) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      const user = users[0];
      return res.status(200).json({
        id: user.id,
        name: user.name,
        username: user.username,
        createdAt: Number(user.created_at),
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Failed to log in' });
    }
  }

  return res.status(400).json({ error: 'Invalid auth action specified' });
}
