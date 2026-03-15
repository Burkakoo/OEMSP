/**
 * Express type extensions
 * Extends Express Request interface with custom properties
 */

import { TokenPayload } from '../services/auth.service';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      token?: string;
    }
  }
}

export {};
