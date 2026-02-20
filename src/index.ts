import express from 'express';
import { matchRouter } from './routes/matches.js';

const app = express();
const port = 8000;

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the Sportz API' });
});

app.use('/matches', matchRouter);

app.listen(port, () => {
  console.log(`Server started on port: ${port}`);
});