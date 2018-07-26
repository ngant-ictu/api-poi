import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PoiOpeningHours } from '../../entities/poi_opening_hours.entity';

@Injectable()
export class PoiOpeningHoursService {
    constructor(
        @InjectRepository(PoiOpeningHours) private readonly openingHoursRepository: Repository<PoiOpeningHours>
    ) {}

    async create(formData: any) {
        const myOpeningHours = await this.openingHoursRepository.findOne({
            piid: formData.piid,
            day: formData.day,
            open: formData.open,
            close: formData.close
        });

        if (typeof myOpeningHours === 'undefined') {
            const myOpeningHours = this.openingHoursRepository.create(formData);

            return await this.openingHoursRepository.save(myOpeningHours);
        }
    }
}
