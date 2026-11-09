import type { Request, Response } from 'express';
import app from '../server';

// =============================================================
// VERCEL SERVERLESS RUNTIME ENVIRONMENT NORMALIZER
// =============================================================
// Automatically parses JSON strings or blobs injected into Vercel environment variables
function normalizeVercelEnvironment(): void {
  const targetKeys = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_CONFIG',
    'SUPABASE_CREDENTIALS',
    'NEW_PUBLISHABLE_KEY',
    'NEW_SECRET_KEY',
    'LEGACY_ANON_KEY',
    'LEGACY_SERVICE_ROLE_KEY',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  for (const key of targetKeys) {
    const raw = process.env[key];
    if (raw && typeof raw === 'string') {
      const trimmed = raw.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed === 'object') {
            Object.assign(process.env, parsed);
          }
        } catch {
          // not JSON, retain original string
        }
      }
    }
  }
}

// Execute environment normalization before delegating to Express
normalizeVercelEnvironment();

export default function handler(req: Request, res: Response) {
  return app(req, res);
}
