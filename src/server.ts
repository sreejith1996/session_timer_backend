import express from 'express';
import type { Application } from 'express';

const app: Application = express();
const PORT = Number(process.env.PORT) || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
