import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { UserException } from "../../filters/error/user-exception.error";
import { User } from "../../entities/user.entity";
import { ConfigService } from "../config.service";
import { TokenService } from "./token.service";

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private readonly config: ConfigService,
        private readonly tokenService: TokenService
    ) {}

    async login(credentials: { userName: string; password: string }) {
        let myUser = await this.userRepository.findOne({
            where: {
                email: credentials.userName
            }
        });

        if (!myUser) {
            myUser = await this.userRepository.findOne({
                where: {
                    mobileNumber: credentials.userName
                }
            });
        }

        const matchedPassword = await myUser.comparePassword(credentials.password);

        if (!myUser || matchedPassword === false) {
            throw new UserException("auth:login:passwordNotMatch");
        }

        return {
            user: myUser,
            token: this.tokenService.sign(myUser)
        };
    }
}
