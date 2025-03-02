import dotenv from 'dotenv';
import { createRequire } from 'module';

dotenv.config();

// Bypass TypeScript static analysis for the 'square' module
// because its type definitions are conflicting with the build setup.
const require = createRequire(import.meta.url);
const Square = require('square') as any;

const { Client, Environment } = Square;

const isProduction = process.env.SQUARE_ENVIRONMENT === 'production';

export const square = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN || '',
  environment: isProduction ? Environment.Production : Environment.Sandbox,
});
