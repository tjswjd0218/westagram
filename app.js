const http = require('http')

const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const { DataSource } = require('typeorm')
const server = http.createServer(app);
const morgan = require('morgan')

app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

const appDataSource = new DataSource({
  type: process.env.DB_CONNECTION,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
})

appDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!")
  })
  .catch((err) => {
    console.log("Error during Data Source initialization", err)
    appDataSource.destroy()
  })

app.get('/ping', function (req, res) {
  res.status(200).json({ message: 'pong' })
})

app.post('/users', async (req, res) => {
  const { name, email, profileImage, password } = req.body;
  await appDataSource.query(
    `INSERT INTO users (
    name,
    email,
    profile_image,
    password)
    VALUES (?, ?, ?, ?)`,
    [name, email, profileImage, password]
  );
  res.status(201).json({ message: 'userCreated' })
});

app.post('/posts', async (req, res) => {
  const { title, content, imageUrl, userId } = req.body;
  await appDataSource.query(
    `INSERT INTO posts (
      title,
      content,
      image_url,
      user_id
    )
    VALUES (?, ?, ?, ?)`,
    [title, content, imageUrl, userId]
  );
  res.status(201).json({ message: 'postCreated' })
});

app.get('/search', async (req, res) => {
  const result = await appDataSource.query(
    `SELECT
    users.id as userId,
    users.profile_image as userProfileImage,
    posts.id as postingId,
    posts.image_url as postingImageUrl,
    posts.content as postingContent
    FROM users INNER JOIN posts
    ON users.id = posts.user_id
    `
  )
  return res.status(200).json({ data: result })
});

app.get('/users/:userId/posts', async (req, res) => {
  const { userId } = req.params;
  const result = await appDataSource.query(
    `SELECT
    u.id as userId,
    u.profile_image as userProfileImage,
    JSON_ARRAYAGG(
      JSON_OBJECT(
        "postingId", p.id,
        "postingImageUrl", p.image_url,
        "postingContent", p.content
      )
    ) as postings
    FROM users as u
    JOIN posts as p ON p.user_id = u.id
    WHERE u.id = ?
    GROUP BY u.id`,
    [userId]
  );
  return res.status(200).json({ data: result })
});

app.patch('/posts/:postId', async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  await appDataSource.query(
    `UPDATE posts
    SET content = ?
    WHERE id = ?`,
    [content, postId]
  )
  const result = await appDataSource.query(
    `SELECT
    u.id as userId,
    u.name as userName,
    p.id as postingId,
    p.title as postingTitle,
    p.content as postingContent
    FROM posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.id = ?
    `,
    [postId]
  )
  return res.status(200).json({ data: result })
});

app.delete('/posts/:postId', async (req, res) => {
  const { postId } = req.params;
  await appDataSource.query(
    `DELETE FROM posts
    WHERE id = ?`,
    [postId]
  )
  return res.status(200).json({ message: 'postDeleted' })
});

app.post('/likes', async (req, res) => {
  const { userId, postId } = req.body;
  await appDataSource.query(
    `INSERT INTO likes (
      user_id,
      post_id
    ) VALUES (?, ?)`,
    [userId, postId]
  )
  return res.status(201).json({ message: 'likeCreated' })
});

const PORT = process.env.PORT;

const start = async () => {
  try {
    server.listen(PORT, () => console.log(`Server is listening on ${PORT}`))
  } catch (err) {
    console.log(err)
  }
}

start();