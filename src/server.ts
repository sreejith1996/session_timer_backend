import express from 'express';
import type { Application } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app: Application = express();
const PORT = Number(process.env.PORT) || 8000;

app.get('/', (req, res) => {
  res.send('Hello world')
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

