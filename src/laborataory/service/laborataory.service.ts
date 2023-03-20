import { Injectable } from '@nestjs/common';
import { CreateLaborataoryInput } from '../dto/create-laborataory.input';
import { UpdateLaborataoryInput } from '../dto/update-laborataory.input';

@Injectable()
export class LaborataoryService {
  create(createLaborataoryInput: CreateLaborataoryInput) {
    return 'This action adds a new laborataory';
  }

  findAll() {
    return `This action returns all laborataory`;
  }

  findOne(id: number) {
    return `This action returns a #${id} laborataory`;
  }

  update(id: number, updateLaborataoryInput: UpdateLaborataoryInput) {
    return `This action updates a #${id} laborataory`;
  }

  remove(id: number) {
    return `This action removes a #${id} laborataory`;
  }
}
