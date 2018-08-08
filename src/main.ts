import { NestFactory } from "@nestjs/core";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import { AppModule } from "./modules/app.module";

const instance = express();
instance.use(cors());
instance.use(bodyParser.json());
instance.use(bodyParser.urlencoded({ extended: false }));

async function bootstrap() {
    const app = await NestFactory.create(AppModule, instance);

    app.listen(9000, process.env.NODE_ENV === 'prod' ? '0.0.0.0' : '');

    console.log("Application is listening on port 9000");
}

bootstrap();
