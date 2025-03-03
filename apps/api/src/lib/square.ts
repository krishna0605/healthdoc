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
// This handles different build execution contexts (local node vs docker container)
const Client = pkg.Client || (pkg as any).default?.Client;
const Environment = pkg.Environment || (pkg as any).default?.Environment;

if (!Client) {
    console.error('CRITICAL: Square Client could not be found in exports.');
    throw new Error('Square Client missing');
}

if (!Environment) {
    console.error('CRITICAL: Square Environment could not be found in exports.');
    throw new Error('Square Environment missing');
}

const isProduction = process.env.SQUARE_ENVIRONMENT === 'production';

// Use a safe fallback for environment enum access just in case
const envOption = isProduction 
    ? (Environment.Production || 'production') 
    : (Environment.Sandbox || 'sandbox');

export const square = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN || '',
  environment: envOption,
});
