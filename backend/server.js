import app from './src/app.js';
import { config } from './src/config/env.js';

app.listen(config.port, () => {
  console.log(`TIDES backend running on http://localhost:${config.port}`);
});