const http = require('http')

const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const { DataSource } = require('typeorm')
const server = http.createServer(app);

app.use(cors());
app.use(express.json())

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

const PORT = process.env.PORT;

const start = async () => {
  try {
    server.listen(PORT, () => console.log(`Server is listening on ${PORT}`))
  } catch (err) {
    console.log(err)
  }
}

start();