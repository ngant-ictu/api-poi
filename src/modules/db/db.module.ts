import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '../config.service';
import { config } from '../app.config';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'mysql',
            host: process.env.DB_HOST,
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            keepConnectionAlive: true,
            entities: [`${__dirname}/../../entities/*.entity.ts`],
            maxQueryExecutionTime: 3600
        })
    ],
    providers: [{ provide: ConfigService, useValue: new ConfigService(config) }]
})
export class DbModule {}
