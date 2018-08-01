import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RegionsService } from "./regions.service";
import { RegionsResolver } from "./regions.resolver";
import { Region } from "../../entities/region.entity";
import { ConfigService } from "../config.service";
import { config } from "../app.config";

@Module({
    imports: [TypeOrmModule.forFeature([Region])],
    exports: [RegionsService],
    providers: [RegionsService, RegionsResolver, { provide: ConfigService, useValue: new ConfigService(config) }]
})
export class RegionsModule {}
