import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigService } from "../config.service";
import { config } from "../app.config";
import { PoisResolver } from "./pois.resolver";
import { PoiInfoService } from "./info.service";
import { PoiInfo } from "../../entities/poi_info.entity";
import { RegionsService } from "../regions/regions.service";
import { Region } from "../../entities/region.entity";
import { PoiOpeningHoursService } from "./opening_hours.service";
import { PoiOpeningHours } from "../../entities/poi_opening_hours.entity";
import { PoiTypeService } from "./type.service";
import { PoiType } from "../../entities/poi_type.entity";
import { PoiNoteService } from "./note.service";
import { PoiNote } from "../../entities/poi_note.entity";
import { ElasticsearchModule } from "@nestjs/elasticsearch";

@Module({
    imports: [
        TypeOrmModule.forFeature([PoiInfo, Region, PoiOpeningHours, PoiType, PoiNote]),
        ElasticsearchModule.register({
            host: `${process.env.ES_HOST}:${process.env.ES_PORT}`
        })
    ],
    exports: [PoiInfoService, RegionsService, PoiOpeningHoursService, PoiTypeService, PoiNoteService],
    providers: [
        PoiInfoService,
        RegionsService,
        PoiOpeningHoursService,
        PoiTypeService,
        PoiNoteService,
        PoisResolver,
        { provide: ConfigService, useValue: new ConfigService(config) }
    ]
})
export class PoisModule {}
