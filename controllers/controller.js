const db = require('../db');
const bcrypt = require('bcrypt'); 

async function registerUser(req, res) {
  const { username, email, password } = req.body;

  try {
    const [existingUsers] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);

    res.json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function loginUser(req, res) {
  const { email, password } = req.body;

  try {
    const [user] = await db.execute('SELECT id, password FROM users WHERE email = ?', [email]);

    if (!user || user.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user[0].password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({ success: true, message: 'User logged in successfully', userId: user[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getFavComicUser(req, res) {
  const userId = req.params.id;

  try {
    const [favoriteComics] = await db.execute('SELECT comics.* FROM comics INNER JOIN favorites ON comics.id = favorites.comic_id WHERE favorites.user_id = ?', [userId]);
    res.json(favoriteComics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function postComic(req, res) {
  const { title, type, chapter, rating, href, thumbnail } = req.body;
  const userId = req.params.id;

  try {
    const [existingComic] = await db.execute('SELECT id FROM comics WHERE title = ?', [title]);

    let comicId;

    if (existingComic && existingComic.length > 0) {
      comicId = existingComic[0].id;

      await db.execute('DELETE FROM favorites WHERE user_id = ? AND comic_id = ?', [userId, comicId]);

      return res.json({ success: true, message: 'Comic removed from favorites successfully' });
    } else {
      const [insertedComic] = await db.execute(
        'INSERT INTO comics (title, type, chapter, rating, href, thumbnail) VALUES (?, ?, ?, ?, ?, ?)',
        [title, type, chapter, rating, href, thumbnail]
      );

      comicId = insertedComic.insertId;
    }

    await db.execute('INSERT INTO favorites (user_id, comic_id) VALUES (?, ?)', [userId, comicId]);

    res.json({ success: true, message: 'Comic operation successful' });
  } catch (error) {

    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}






module.exports = {
  registerUser,
  loginUser,
  getFavComicUser,
  postComic
};
