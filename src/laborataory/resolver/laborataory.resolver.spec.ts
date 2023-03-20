import { Test, TestingModule } from '@nestjs/testing';
import { LaborataoryResolver } from './laborataory.resolver';
import { LaborataoryService } from '../service/laborataory.service';

describe('LaborataoryResolver', () => {
  let resolver: LaborataoryResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LaborataoryResolver, LaborataoryService],
    }).compile();

    resolver = module.get<LaborataoryResolver>(LaborataoryResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
