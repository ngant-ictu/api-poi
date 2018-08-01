import { Injectable } from "@nestjs/common";
import * as convict from "convict";

@Injectable()
export class ConfigService {
    constructor(private config: convict.Config<any>) {}

    get<T = any>(key: string): T {
        return this.config.get(key);
    }
}
