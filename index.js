import express from 'express';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import pg from 'pg';

const { Pool } = pg;

const app = express();
const port = 3008;

// PostgreSQL connection config
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'MindMash',
  password: 'Zakeen123@',
  port: 4000,
});

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Home route — list all or filtered thoughts
app.get('/', async (req, res) => {
  const { q, category } = req.query;
  let query = 'SELECT * FROM thoughts';
  let conditions = [];
  let values = [];

  if (q) {
    conditions.push(`LOWER(content) LIKE $${values.length + 1}`);
    values.push(`%${q.toLowerCase()}%`);
  }

  if (category) {
    conditions.push(`LOWER(category) = $${values.length + 1}`);
    values.push(category.toLowerCase());
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY id DESC';

  try {
    const result = await pool.query(query, values);
    res.render('index', {
      thoughts: result.rows,
      query: q || '',
      category: category?.toLowerCase() || ''
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving thoughts');
  }
});

// New Thought Form
app.get('/thoughts/new', (req, res) => {
  res.render('new');
});

// Create Thought
app.post('/thoughts', async (req, res) => {
  const { content, category } = req.body;
  try {
    await pool.query(
      'INSERT INTO thoughts (content, category, created_at) VALUES ($1, $2, NOW())',
      [content, category.toLowerCase()]
    );
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating thought');
  }
});

// Edit Thought Form
app.get('/thoughts/:id/edit', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM thoughts WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).send('Thought not found');
    res.render('edit', { thought: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading thought for edit');
  }
});

// Update Thought
app.put('/thoughts/:id', async (req, res) => {
  const { id } = req.params;
  const { content, category } = req.body;
  try {
    await pool.query(
      'UPDATE thoughts SET content = $1, category = $2 WHERE id = $3',
      [content, category.toLowerCase(), id]
    );
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating thought');
  }
});

// Delete Thought
app.delete('/thoughts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM thoughts WHERE id = $1', [id]);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting thought');
  }
});

// Start Server
app.listen(port, () => {
  console.log(`✅ MindMash is running: http://localhost:${port}`);
});
