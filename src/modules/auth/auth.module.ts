import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { User } from '../../entities/user.entity';
import { ConfigService } from '../config.service';
import { config } from '../app.config';
import { AuthResolver } from './auth.resolver';
import { TokenService } from './token.service';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([User])],
    exports: [AuthService, TokenService],
    providers: [
        AuthService,
        TokenService,
        AuthResolver,
        { provide: ConfigService, useValue: new ConfigService(config) }
    ]
})
export class AuthModule {}
