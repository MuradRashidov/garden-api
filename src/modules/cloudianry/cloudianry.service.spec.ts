import { Test, TestingModule } from '@nestjs/testing';
import { CloudianryService } from './cloudianry.service';

describe('CloudianryService', () => {
  let service: CloudianryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CloudianryService],
    }).compile();

    service = module.get<CloudianryService>(CloudianryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
