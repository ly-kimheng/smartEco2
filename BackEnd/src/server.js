
import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { testConnection } from './config/database.js';

const PORT = process.env.PORT || 5000;

testConnection();

app.listen(PORT, () => {
  console.log(`SmartEco backend running on port ${PORT}`);
});