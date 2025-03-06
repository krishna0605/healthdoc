import dotenv from 'dotenv';
import { createRequire } from 'module';

dotenv.config();

const require = createRequire(import.meta.url);
// Load the package using CommonJS require to bypass ESM strictness
const pkg = require('square');

// Debugging: Log what we actually got from the package
console.log('Square Package Logic: Loaded package keys:', Object.keys(pkg));
if (pkg && typeof pkg === 'object' && 'default' in pkg) {
    console.log('Square Package Logic: Found .default export keys:', Object.keys((pkg as any).default));
}

// Robust Resolution: Check both top-level and .default
// Based on logs: keys include 'SquareClient', 'SquareEnvironment'
const Client = pkg.SquareClient || (pkg as any).default?.SquareClient || pkg.Client || (pkg as any).default?.Client;
const Environment = pkg.SquareEnvironment || (pkg as any).default?.SquareEnvironment || pkg.Environment || (pkg as any).default?.Environment;

if (!Client) {
    console.error('CRITICAL: Square Client could not be found in exports.');
    console.error('Available keys:', Object.keys(pkg));
    throw new Error('Square Client missing');
}

if (!Environment) {
    console.error('CRITICAL: Square Environment could not be found in exports.');
    throw new Error('Square Environment missing');
}

// Default to production if NODE_ENV is production (Railway default), OR if explicitly set
const isProduction = process.env.SQUARE_ENVIRONMENT === 'production' || process.env.NODE_ENV === 'production';
console.log(`[Square SDK] Initializing in ${isProduction ? 'PRODUCTION' : 'SANDBOX'} mode`);

// Use a safe fallback for environment enum access just in case
// Note: SquareEnvironment behaves like an object/enum
const envOption = isProduction 
    ? (Environment.Production || 'production') 
    : (Environment.Sandbox || 'sandbox');

export const square = new Client({
  token: process.env.SQUARE_ACCESS_TOKEN || '',
  environment: envOption,
});
