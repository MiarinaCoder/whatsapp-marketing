import { buildApp } from './app.js';
import 'dotenv/config';

const app = buildApp();
app.listen({ port: Number(process.env.PORT) || 3000 }, (err: Error | null) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});