import express from 'express';
import { matchRouter } from './routes/matches.js';
import http from 'http'
import { attachWss } from './ws/server.js';

const PORT = Number(process.env.PORT) || 8000;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
const server = http.createServer(app);


app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the Sportz API' });
});

app.use('/matches', matchRouter);

const {broadcastMatchCreated} = attachWss(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

console.log(app.locals)



server.listen(PORT, HOST, () => {
  const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
  console.log(`Server started on port: ${baseUrl}`);
  console.log(`Websocket server started on port: ${baseUrl.replace('http', 'ws')}/ws`)
}); 