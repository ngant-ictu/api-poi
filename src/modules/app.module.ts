import { Module, MiddlewareConsumer, NestModule, RequestMethod } from "@nestjs/common";
import { GraphQLModule, GraphQLFactory } from "@nestjs/graphql";
import { graphqlExpress } from "apollo-server-express";
import * as GraphQLJSON from "graphql-type-json";
import { apolloUploadExpress } from "apollo-upload-server";
import { GraphQLUpload } from "apollo-upload-server";
import { RavenModule } from "nest-raven";
import { LoggerMiddleware } from "../middlewares/logger.middleware";
import { DbModule } from "./db/db.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { PoisModule } from "./pois/pois.module";
import { RegionsModule } from "./regions/regions.module";
import { ConfigService } from "./config.service";
import { config } from "./app.config";

@Module({
    imports: [
        RavenModule.forRoot("https://73486251a2a34ac9badb331eee24ee3e@sentry.io/1232548"),
        DbModule,
        UsersModule,
        AuthModule,
        PoisModule,
        RegionsModule,
        GraphQLModule
    ],
    providers: [{ provide: ConfigService, useValue: new ConfigService(config) }]
})
export class AppModule implements NestModule {
    constructor(private readonly graphQLFactory: GraphQLFactory) {}

    configure(consumer: MiddlewareConsumer) {
        const schema = this.createSchema();

        consumer.apply(apolloUploadExpress()).forRoutes("/graphql");
        consumer.apply(LoggerMiddleware).forRoutes("/graphql");
        consumer
            .apply((req, res, next) => {
                graphqlExpress((req, res) => {
                    return {
                        schema,
                        rootValue: req
                    };
                })(req, res, next);
            })
            .forRoutes("/graphql");
    }

    createSchema() {
        const typeDefs = this.graphQLFactory.mergeTypesByPaths("./**/*.graphql");
        const schema = this.graphQLFactory.createSchema({
            typeDefs,
            resolvers: {
                JSON: GraphQLJSON,
                Upload: GraphQLUpload
            }
        });
        return schema;
    }
}
