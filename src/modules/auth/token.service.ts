import { decode, sign, verify } from "jsonwebtoken";
import { Injectable } from "@nestjs/common";

@Injectable()
export class TokenService {
    public sign(user: any) {
        return sign(
            {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                avatar: user.avatar,
                isStaff: user.isStaff,
                isSuperUser: user.isSuperUser
            },
            this.getSecretKey({
                id: user.id,
                isStaff: user.isStaff,
                isSuperUser: user.isSuperUser
            }),
            {
                expiresIn: process.env.AUTH_EXPIRE
            }
        );
    }

    public verify(token: string) {
        const data: any = decode(token);
        return verify(token, this.getSecretKey(data));
    }

    public decode(token: string) {
        return decode(token);
    }

    private getSecretKey(data: any) {
        return process.env.AUTH_SALT + (data ? "$" + data.id + "$" + data.isStaff + "$" + data.isSuperUser : "");
    }
}
