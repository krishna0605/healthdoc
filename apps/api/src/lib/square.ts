import { Client, Environment } from 'square';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.SQUARE_ENVIRONMENT === 'production';

export const square = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? Environment.Production : Environment.Sandbox,
});
