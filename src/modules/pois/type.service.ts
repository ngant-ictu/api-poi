import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PoiType } from '../../entities/poi_type.entity';
import { validate } from 'class-validator';

@Injectable()
export class PoiTypeService {
    constructor(@InjectRepository(PoiType) private readonly typeRepository: Repository<PoiType>) {}

    async create(formData: any) {
        const myType = this.typeRepository.create(formData);

        const errors = await validate(myType, {
            validationError: { target: false }
        });

        if (errors.length === 0) {
            return await this.typeRepository.save(myType);
        }
    }
}
