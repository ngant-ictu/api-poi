import { Module, Global } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersService } from "./users.service";
import { UsersResolver } from "./users.resolver";
import { User } from "../../entities/user.entity";
import { ConfigService } from "../config.service";
import { config } from "../app.config";

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([User])],
    exports: [UsersService],
    providers: [UsersService, UsersResolver, { provide: ConfigService, useValue: new ConfigService(config) }]
})
export class UsersModule {}
