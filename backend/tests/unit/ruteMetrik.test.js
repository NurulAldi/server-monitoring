const express = require('express');
const request = require('supertest');
const ruteMetrik = require('../../src/rute/ruteMetrik');

describe('ruteMetrik', () => {
  test('exports an express router', () => {
    expect(ruteMetrik).toBeDefined();
    // Express routers are functions and have a stack array
    expect(typeof ruteMetrik === 'function' || Array.isArray(ruteMetrik.stack)).toBe(true);
  });

  test('GET / returns active message', async () => {
    const app = express();
    app.use('/api/metrik', ruteMetrik);

    const res = await request(app).get('/api/metrik/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message');
  });

  test('GET /latest returns data array', async () => {
    const app = express();
    app.use('/api/metrik', ruteMetrik);

    const res = await request(app).get('/api/metrik/latest');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});