import { getDb } from './db.js';

export default async function handler(req, res) {
  const sql = getDb();
  if (!sql) {
    return res.status(503).json({
      error: 'Database not connected. Please run `npx vercel env pull .env.local` or set DATABASE_URL.',
    });
  }

  // Ensure tables exist
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
    await sql`
      CREATE TABLE IF NOT EXISTS fits (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        image TEXT NOT NULL,
        links JSONB DEFAULT '[]'::jsonb,
        likes INT DEFAULT 0,
        author_id VARCHAR(100) NOT NULL,
        author_name VARCHAR(100) NOT NULL,
        created_at BIGINT NOT NULL
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS fit_likes (
        user_id VARCHAR(100) NOT NULL,
        fit_id VARCHAR(100) NOT NULL,
        PRIMARY KEY (user_id, fit_id)
      );
    `;
  } catch (err) {
    console.error('Table init error:', err);
  }

  const { method } = req;
  const { action, id, userId } = req.query;

  // GET /api/fits - Fetch all fits
  if (method === 'GET') {
    try {
      const rows = await sql`
        SELECT f.*, 
               COALESCE(fl.user_id IS NOT NULL, FALSE) AS liked
        FROM fits f
        LEFT JOIN fit_likes fl 
          ON f.id = fl.fit_id AND fl.user_id = ${userId || ''}
        ORDER BY f.created_at DESC;
      `;

      const fits = rows.map((r) => ({
        id: r.id,
        name: r.name,
        image: r.image,
        links: typeof r.links === 'string' ? JSON.parse(r.links) : r.links || [],
        likes: r.likes || 0,
        liked: Boolean(r.liked),
        authorId: r.author_id,
        authorName: r.author_name,
        createdAt: Number(r.created_at),
      }));

      return res.status(200).json(fits);
    } catch (error) {
      console.error('GET /api/fits error:', error);
      return res.status(500).json({ error: 'Failed to fetch fits' });
    }
  }

  // POST /api/fits - Create new fit OR toggle like
  if (method === 'POST') {
    if (action === 'like') {
      const { fitId, userId } = req.body || {};
      if (!fitId || !userId) {
        return res.status(400).json({ error: 'Missing fitId or userId' });
      }

      try {
        const existingLike = await sql`
          SELECT * FROM fit_likes WHERE user_id = ${userId} AND fit_id = ${fitId}
        `;

        let isLiked = false;
        if (existingLike.length > 0) {
          // Unlike
          await sql`DELETE FROM fit_likes WHERE user_id = ${userId} AND fit_id = ${fitId}`;
          await sql`UPDATE fits SET likes = GREATEST(0, likes - 1) WHERE id = ${fitId}`;
          isLiked = false;
        } else {
          // Like
          await sql`INSERT INTO fit_likes (user_id, fit_id) VALUES (${userId}, ${fitId})`;
          await sql`UPDATE fits SET likes = likes + 1 WHERE id = ${fitId}`;
          isLiked = true;
        }

        const [updatedFit] = await sql`SELECT likes FROM fits WHERE id = ${fitId}`;
        return res.status(200).json({ liked: isLiked, likes: updatedFit ? updatedFit.likes : 0 });
      } catch (error) {
        console.error('POST /api/fits?action=like error:', error);
        return res.status(500).json({ error: 'Failed to update like status' });
      }
    }

    // Create Fit
    const { id, name, image, links, authorId, authorName, createdAt } = req.body || {};
    if (!name || !image || !authorId) {
      return res.status(400).json({ error: 'Missing required outfit fields' });
    }

    const fitId = id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const createdTimestamp = createdAt || Date.now();

    try {
      await sql`
        INSERT INTO fits (id, name, image, links, likes, author_id, author_name, created_at)
        VALUES (${fitId}, ${name}, ${image}, ${JSON.stringify(links || [])}::jsonb, 0, ${authorId}, ${authorName || 'Community Member'}, ${createdTimestamp})
      `;

      return res.status(201).json({
        id: fitId,
        name,
        image,
        links: links || [],
        likes: 0,
        liked: false,
        authorId,
        authorName: authorName || 'Community Member',
        createdAt: createdTimestamp,
      });
    } catch (error) {
      console.error('POST /api/fits error:', error);
      return res.status(500).json({ error: 'Failed to create fit' });
    }
  }

  // DELETE /api/fits - Delete fit
  if (method === 'DELETE') {
    const fitId = id || req.body?.id;
    const authorId = userId || req.body?.authorId;

    if (!fitId) {
      return res.status(400).json({ error: 'Missing fit id' });
    }

    try {
      if (authorId) {
        await sql`DELETE FROM fits WHERE id = ${fitId} AND author_id = ${authorId}`;
      } else {
        await sql`DELETE FROM fits WHERE id = ${fitId}`;
      }

      await sql`DELETE FROM fit_likes WHERE fit_id = ${fitId}`;
      return res.status(200).json({ success: true, deletedId: fitId });
    } catch (error) {
      console.error('DELETE /api/fits error:', error);
      return res.status(500).json({ error: 'Failed to delete fit' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
