import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PoiInfo } from '../../entities/poi_info.entity';
import { validate } from 'class-validator';

@Injectable()
export class PoiInfoService {
    constructor(@InjectRepository(PoiInfo) private readonly infoRepository: Repository<PoiInfo>) {}

    async create(formData: any) {
        let myInfo;
        myInfo = this.infoRepository.create(formData);

        const errors = await validate(myInfo, {
            validationError: { target: false }
        });

        if (errors.length > 0) {
            myInfo = await this.infoRepository.findOne({
                slug: formData.slug
            });
        } else {
            myInfo = await this.infoRepository.save(myInfo);
        }

        return myInfo;
    }
}
