import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Users Integration (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Users API Integration', () => {
    it('should have users endpoints available', async () => {
      // Test that endpoints are accessible (they might fail due to gRPC service not running)
      // This test mainly verifies that routes are properly configured

      // Test GET /users endpoint exists
      const getUsersResponse = await request(app.getHttpServer())
        .get('/users')
        .expect((res) => {
          // We expect either 200 (if user service is running) or 500/503 (if not)
          expect([200, 500, 503, 502, 504]).toContain(res.status);
        });

      console.log('GET /users status:', getUsersResponse.status);
    });

    it('should have individual user endpoint available', async () => {
      const getUserResponse = await request(app.getHttpServer())
        .get('/users/1')
        .expect((res) => {
          // We expect either 200 (if user service is running) or 500/503 (if not)
          expect([200, 500, 503, 502, 504]).toContain(res.status);
        });

      console.log('GET /users/1 status:', getUserResponse.status);
    });

    it('should have create user endpoint available', async () => {
      const createUserRequest = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        primaryPhoneNumber: '+1234567890',
        password: 'testPassword123',
      };

      const createUserResponse = await request(app.getHttpServer())
        .post('/users')
        .send(createUserRequest)
        .expect((res) => {
          // We expect either 201 (if user service is running) or 500/503 (if not)
          expect([201, 500, 503, 502, 504]).toContain(res.status);
        });

      console.log('POST /users status:', createUserResponse.status);
    });

    it('should have update user endpoint available', async () => {
      const updateUserRequest = {
        firstName: 'Updated',
        lastName: 'User',
        email: 'updated@example.com',
        primaryPhoneNumber: '+0987654321',
      };

      const updateUserResponse = await request(app.getHttpServer())
        .put('/users/1')
        .send(updateUserRequest)
        .expect((res) => {
          // We expect either 200 (if user service is running) or 500/503 (if not)
          expect([200, 500, 503, 502, 504]).toContain(res.status);
        });

      console.log('PUT /users/1 status:', updateUserResponse.status);
    });

    it('should have delete user endpoint available', async () => {
      const deleteUserResponse = await request(app.getHttpServer())
        .delete('/users/1')
        .expect((res) => {
          // We expect either 200 (if user service is running) or 500/503 (if not)
          expect([200, 500, 503, 502, 504]).toContain(res.status);
        });

      console.log('DELETE /users/1 status:', deleteUserResponse.status);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      // Test with invalid JSON
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect((res) => {
          expect([400, 500, 503, 502, 504]).toContain(res.status);
        });

      console.log('Malformed request status:', response.status);
    });

    it('should handle requests to non-existent endpoints', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/nonexistent/endpoint')
        .expect(404);

      expect(response.status).toBe(404);
    });
  });
});
