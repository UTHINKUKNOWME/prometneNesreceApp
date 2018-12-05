import { TestBed, inject } from '@angular/core/testing';

import { DogodkiService } from './dogodki.service';

describe('DogodkiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DogodkiService]
    });
  });

  it('should be created', inject([DogodkiService], (service: DogodkiService) => {
    expect(service).toBeTruthy();
  }));
});
