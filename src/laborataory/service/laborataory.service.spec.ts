import { Test, TestingModule } from '@nestjs/testing';
import { LaborataoryService } from './laborataory.service';

describe('LaborataoryService', () => {
  let service: LaborataoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LaborataoryService],
    }).compile();

    service = module.get<LaborataoryService>(LaborataoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
