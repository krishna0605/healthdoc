import { Client, Environment } from 'square';
import dotenv from 'dotenv';
import { createRequire } from 'module';

dotenv.config();

// Fix for Square SDK CommonJS/ESM interop issues
let SquareClient = Client;
let SquareEnvironment = Environment;

// Fallback if named exports are missing (CommonJS module loaded as default)
if (!SquareClient) {
  const require = createRequire(import.meta.url);
  const Square = require('square');
  SquareClient = Square.Client;
  SquareEnvironment = Square.Environment;
}

const isProduction = process.env.SQUARE_ENVIRONMENT === 'production';

export const square = new SquareClient({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});
