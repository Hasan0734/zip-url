import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { beforeEach, describe, it } from 'node:test';
import expectCookies from 'supertest/lib/cookies';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expectCookies(service:sting).toBeDefined();
  });
});
