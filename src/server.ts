import { buildApp } from './app';
import 'dotenv/config';

const app = buildApp();
app.listen({ port: Number(process.env.PORT) || 3000 }, (err) => {
  if (err) { app.log.error(err); process.exit(1); }
});