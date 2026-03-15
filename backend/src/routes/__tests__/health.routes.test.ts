/**
 * Health Check Routes Tests
 * Unit tests for health check endpoints
 */

import request from 'supertest';
import express, { Application } from 'express';
import healthRoutes from '../health.routes';
import * as dbConfig from '../../config/database.config';

// Mock the database config module
jest.mock('../../config/database.config');

describe('Health Check Routes', () => {
  let app: Application;

  beforeEach(() => {
    app = express();
    app.use('/health', healthRoutes);
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return healthy status when database is connected', async () => {
      // Mock database as connected
      (dbConfig.isConnected as jest.Mock).mockReturnValue(true);
      (dbConfig.getConnectionState as jest.Mock).mockReturnValue('connected');

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'healthy',
        database: {
          connected: true,
          state: 'connected',
        },
      });
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return unhealthy status when database is disconnected', async () => {
      // Mock database as disconnected
      (dbConfig.isConnected as jest.Mock).mockReturnValue(false);
      (dbConfig.getConnectionState as jest.Mock).mockReturnValue('disconnected');

      const response = await request(app).get('/health');

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        status: 'unhealthy',
        database: {
          connected: false,
          state: 'disconnected',
        },
      });
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health information when database is connected', async () => {
      // Mock database as connected
      (dbConfig.isConnected as jest.Mock).mockReturnValue(true);
      (dbConfig.getConnectionState as jest.Mock).mockReturnValue('connected');
      (dbConfig.getPoolStats as jest.Mock).mockReturnValue({
        state: 'connected',
        host: 'localhost:27017',
        name: 'test-db',
      });

      const response = await request(app).get('/health/detailed');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'healthy',
        system: {
          uptime: expect.any(Number),
          memory: {
            used: expect.any(Number),
            total: expect.any(Number),
            unit: 'MB',
          },
          nodeVersion: expect.any(String),
          platform: expect.any(String),
        },
        database: {
          connected: true,
          state: 'connected',
          host: 'localhost:27017',
          name: 'test-db',
        },
      });
    });

    it('should return 503 when database is disconnected', async () => {
      // Mock database as disconnected
      (dbConfig.isConnected as jest.Mock).mockReturnValue(false);
      (dbConfig.getConnectionState as jest.Mock).mockReturnValue('disconnected');
      (dbConfig.getPoolStats as jest.Mock).mockReturnValue({
        state: 'disconnected',
        host: undefined,
        name: undefined,
      });

      const response = await request(app).get('/health/detailed');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('unhealthy');
    });
  });

  describe('GET /health/ready', () => {
    it('should return ready when database is connected', async () => {
      (dbConfig.isConnected as jest.Mock).mockReturnValue(true);

      const response = await request(app).get('/health/ready');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        ready: true,
        timestamp: expect.any(String),
      });
    });

    it('should return not ready when database is disconnected', async () => {
      (dbConfig.isConnected as jest.Mock).mockReturnValue(false);

      const response = await request(app).get('/health/ready');

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        ready: false,
        reason: 'Database not connected',
        timestamp: expect.any(String),
      });
    });
  });

  describe('GET /health/live', () => {
    it('should always return alive status', async () => {
      const response = await request(app).get('/health/live');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        alive: true,
        timestamp: expect.any(String),
      });
    });

    it('should return alive even when database is disconnected', async () => {
      (dbConfig.isConnected as jest.Mock).mockReturnValue(false);

      const response = await request(app).get('/health/live');

      expect(response.status).toBe(200);
      expect(response.body.alive).toBe(true);
    });
  });
});
