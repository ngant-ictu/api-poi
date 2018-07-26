import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '../config.service';
import { config } from '../app.config';
import { PoisResolver } from './pois.resolver';
import { PoiInfoService } from './info.service';
import { PoiInfo } from '../../entities/poi_info.entity';
import { RegionsService } from '../regions/regions.service';
import { Region } from '../../entities/region.entity';
import { PoiOpeningHoursService } from './opening_hours.service';
import { PoiOpeningHours } from '../../entities/poi_opening_hours.entity';
import { PoiTypeService } from './type.service';
import { PoiType } from '../../entities/poi_type.entity';

@Module({
    imports: [TypeOrmModule.forFeature([PoiInfo, Region, PoiOpeningHours, PoiType])],
    exports: [PoiInfoService, RegionsService, PoiOpeningHoursService],
    providers: [
        PoiInfoService,
        RegionsService,
        PoiOpeningHoursService,
        PoiTypeService,
        PoisResolver,
        { provide: ConfigService, useValue: new ConfigService(config) }
    ]
})
export class PoisModule {}
