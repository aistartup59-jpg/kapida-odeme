/* eslint-disable @typescript-eslint/no-var-requires */

// The limits are read once, when the controller classes are defined, so they have to be in
// place before anything under src/ is loaded. That rules out `import` here: TypeScript hoists
// every import above the statements below, which would load the policy with the suite-wide
// values from .env.test and leave nothing to exhaust.
process.env.RATE_LIMIT_SIGNUP_PER_MINUTE = '3';
process.env.RATE_LIMIT_AUTH_PER_MINUTE = '4';
process.env.RATE_LIMIT_GLOBAL_PER_MINUTE = '25';
process.env.RATE_LIMIT_PARTNER_PER_MINUTE = '3';
process.env.TRUST_PROXY = '1';

const { ValidationPipe } = require('@nestjs/common');
const { Test } = require('@nestjs/testing');
const request = require('supertest');
const { DataSource } = require('typeorm');

const { AppModule } = require('../../../src/app.module');
const { configureProxyTrust } = require('../../../src/shared/rate-limit/proxy-trust');

// Each test speaks from its own address so one test exhausting a limit cannot starve the
// next: the counters are per client and the window is a whole minute, far longer than this
// file takes to run. TRUST_PROXY=1 above is what makes the header meaningful — the same
// setting a deployment behind a load balancer uses, exercised here rather than described.
const RUNAWAY_SIGNUPS = '203.0.113.1';
const PASSWORD_GUESSING = '203.0.113.2';
const EXHAUSTED_NEIGHBOUR = '203.0.113.3';
const INNOCENT_NEIGHBOUR = '203.0.113.4';
const TWO_PLATFORMS = '203.0.113.5';
const UNLIMITED_ROUTE = '203.0.113.6';

describe('Security - Rate Limiting', () => {
  let app: any;
  let counter = 0;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    configureProxyTrust(app);
    await app.init();
  });

  afterAll(async () => {
    await app
      .get(DataSource)
      .query('TRUNCATE TABLE "partner_api_keys", "merchant_sessions", "merchants" RESTART IDENTITY CASCADE');
    await app.close();
  });

  function registerFrom(ip: string) {
    counter += 1;
    return request(app.getHttpServer())
      .post('/api/auth/merchant/register')
      .set('X-Forwarded-For', ip)
      .send({
        businessName: `Rate Limited ${counter}`,
        ownerFullName: `Rate Limited Owner ${counter}`,
        phoneNumber: `+90544000${String(counter).padStart(4, '0')}`,
        email: `rate-limit-${counter}@test.local`,
        password: 'StrongPass123',
      });
  }

  async function registerAndLoginFrom(ip: string): Promise<string> {
    await registerFrom(ip).expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/auth/merchant/login')
      .set('X-Forwarded-For', ip)
      .send({ email: `rate-limit-${counter}@test.local`, password: 'StrongPass123' })
      .expect(201);

    return login.body.accessToken as string;
  }

  it('stops one address from creating accounts without bound', async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await registerFrom(RUNAWAY_SIGNUPS).expect(201);
    }

    const blocked = await registerFrom(RUNAWAY_SIGNUPS);

    expect(blocked.status).toBe(429);
  });

  it('stops password guessing against a known account', async () => {
    await registerAndLoginFrom(PASSWORD_GUESSING);
    const email = `rate-limit-${counter}@test.local`;

    // One of the four allowed attempts was the successful login above.
    const guess = () =>
      request(app.getHttpServer())
        .post('/api/auth/merchant/login')
        .set('X-Forwarded-For', PASSWORD_GUESSING)
        .send({ email, password: 'WrongPassword123' });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect((await guess()).status).toBe(401);
    }

    expect((await guess()).status).toBe(429);
  });

  it('limits the offending client only, never its neighbours', async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await registerFrom(EXHAUSTED_NEIGHBOUR).expect(201);
    }
    await registerFrom(EXHAUSTED_NEIGHBOUR).expect(429);

    await registerFrom(INNOCENT_NEIGHBOUR).expect(201);
  });

  // The property that address-based counting would get wrong: an order platform's backend is
  // one machine acting for every courier it employs, and two platforms can sit behind the
  // same address. Counting by API key is what keeps one integrator's traffic its own.
  it('counts the partner channel per API key rather than per address', async () => {
    const busyPlatform = await issueKeyFor(TWO_PLATFORMS);
    const quietPlatform = await issueKeyFor(TWO_PLATFORMS);

    for (let order = 0; order < 3; order += 1) {
      await mintHandoff(busyPlatform, `BUSY-${order}`).expect(201);
    }

    await mintHandoff(busyPlatform, 'BUSY-OVER').expect(429);
    await mintHandoff(quietPlatform, 'QUIET-0').expect(201);
  });

  it('applies the global backstop to routes with no limit of their own', async () => {
    const probe = () => request(app.getHttpServer()).get('/api/health').set('X-Forwarded-For', UNLIMITED_ROUTE);

    for (let attempt = 0; attempt < 25; attempt += 1) {
      expect((await probe()).status).toBe(200);
    }

    expect((await probe()).status).toBe(429);
  });

  async function issueKeyFor(ip: string): Promise<string> {
    const accessToken = await registerAndLoginFrom(ip);

    const response = await request(app.getHttpServer())
      .post('/api/merchant/partner-keys')
      .set('X-Forwarded-For', ip)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ label: 'Rate Limit Platform' })
      .expect(201);

    return response.body.apiKey as string;
  }

  function mintHandoff(apiKey: string, externalOrderId: string) {
    return request(app.getHttpServer())
      .post('/api/partner/handoffs')
      .set('X-Forwarded-For', TWO_PLATFORMS)
      .set('X-Api-Key', apiKey)
      .send({ externalOrderId, totalAmount: 100 });
  }
});
