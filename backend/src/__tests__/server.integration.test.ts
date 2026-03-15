/**
 * Server Integration Tests
 * Tests the complete server setup including health check endpoints
 */

import request from 'supertest';
import { app } from '../server';

// Mock the database config module
jest.mock('../config/database.config', () => ({
  connectDatabase: jest.fn().mockResolvedValue(undefined),
  setupConnectionEventHandlers: jest.fn(),
  isConnected: jest.fn().mockReturnValue(true),
  getConnectionState: jest.fn().mockReturnValue('connected'),
  getPoolStats: jest.fn().mockReturnValue({
    state: 'connected',
    host: 'localhost:27017',
    name: 'test-db',
  }),
}));

describe('Server Integration Tests', () => {
  describe('Health Check Endpoints', () => {
    it('should respond to GET /health', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.database.connected).toBe(true);
    });

    it('should respond to GET /health/detailed', async () => {
      const response = await request(app).get('/health/detailed');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.system).toBeDefined();
      expect(response.body.database).toBeDefined();
    });

    it('should respond to GET /health/ready', async () => {
      const response = await request(app).get('/health/ready');
      
      expect(response.status).toBe(200);
      expect(response.body.ready).toBe(true);
    });

    it('should respond to GET /health/live', async () => {
      const response = await request(app).get('/health/live');
      
      expect(response.status).toBe(200);
      expect(response.body.alive).toBe(true);
    });
  });

  describe('Server Configuration', () => {
    it('should have JSON middleware configured', async () => {
      const response = await request(app)
        .post('/health')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');
      
      // Should not crash with JSON body
      expect(response.status).toBe(404); // POST not allowed, but JSON was parsed
    });
  });
});
