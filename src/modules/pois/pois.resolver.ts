import { UseInterceptors, UseGuards, BadRequestException } from "@nestjs/common";
import { Resolver, Query, Mutation } from "@nestjs/graphql";
import { AuthGuard } from "../../guards/auth.guard";
import { Roles } from "../../decorators/roles.decorator";
import { PoiInfoService } from "./info.service";
import { PoiTypeService } from "./type.service";
import { PoiType } from "../../entities/poi_type.entity";
import { plainToClass } from "class-transformer";
import { PoiTypeTransformInterceptor } from "../../interceptors/poi_type-transform.interceptor";
import { PoiTypeSearchTransformInterceptor } from "../../interceptors/poi_type-search-transform.interceptor";
import { PoiInfoTransformInterceptor } from "../../interceptors/poi_info-transform.interceptor";
import { PoiInfo } from "../../entities/poi_info.entity";
import * as xlsx from "node-xlsx";
import * as GoogleMaps from "@google/maps";

@Resolver("Poi")
@UseGuards(AuthGuard)
export class PoisResolver {
    constructor(private readonly poiInfoService: PoiInfoService, private readonly poiTypeService: PoiTypeService) {}

    @Mutation("importPoiType")
    @Roles("isSuperUser")
    async importPoiType() {
        let count: number = 0;

        const workSheetsFromFile = xlsx.parse(`${process.cwd()}/src/storage/data/entity.xlsx`);
        const data = workSheetsFromFile[0].data;

        await Promise.all(
            data.map(async (row, key) => {
                // // exclude field title
                if (key >= 1) {
                    const typeName = row[0];

                    const olliSimilar = row.map((col, index) => (index == 1 ? col : null));
                    const typeOlliSimilar = olliSimilar.filter(obj => obj).join(",");

                    const ggSimilar = row.map((col, index) => (index == 2 ? col : null));
                    const typeGgSimilar = ggSimilar.filter(obj => obj).join(",");

                    try {
                        await this.poiTypeService.create({
                            name: typeName,
                            similar: typeOlliSimilar,
                            ggSimilar: typeGgSimilar
                        });
                    } catch (err) {
                        throw new BadRequestException(err);
                    }

                    count++;
                }
            })
        );

        console.log("TOTAL POI TYPE IMPORTED: " + count);

        return count;
    }

    @Query("testPlace")
    @Roles("isSuperUser")
    async testPlace(_: any, { name }) {
        let output: any = [];

        const googleMapsClient = GoogleMaps.createClient({
            key: process.env.GOOGLE_API_KEY,
            Promise: Promise
        });

        const responseSearch = await googleMapsClient
            .places({
                query: name,
                language: "vi"
            })
            .asPromise();

        // const responseSearch = await googleMapsClient.geocode({
        //   address: name,
        //   language: 'vi'
        // }).asPromise();

        // dump(responseSearch)

        await Promise.all(
            responseSearch.json.results.map(async place => {
                const responsePlace = await googleMapsClient
                    .place({
                        placeid: place.place_id,
                        language: "vi"
                    })
                    .asPromise();

                output.push(responsePlace);
            })
        );

        return output;
    }

    @Query("getPoiTypes")
    @Roles("isSuperUser")
    @UseInterceptors(new PoiTypeTransformInterceptor())
    async getPoiTypes(_: any, { opts }) {
        try {
            const myPoiTypes = await this.poiTypeService.findAll({
                curPage: opts.curPage,
                perPage: opts.perPage,
                q: opts.q,
                sort: opts.sort
            });
            return {
                items: plainToClass(PoiType, myPoiTypes.items),
                meta: myPoiTypes.meta
            };
        } catch (error) {
            throw error;
        }
    }

    @Mutation("updatePoiTypeSimilar")
    @Roles("isSuperUser")
    @UseInterceptors(new PoiTypeTransformInterceptor())
    async updatePoiTypeSimilar(_: any, { id, input }) {
        try {
            return await this.poiTypeService.updateSimilar(id, input.similar);
        } catch (error) {
            throw error;
        }
    }

    @Mutation("updatePoiTypeGgSimilar")
    @Roles("isSuperUser")
    @UseInterceptors(new PoiTypeTransformInterceptor())
    async updatePoiTypeGgSimilar(_: any, { id, input }) {
        try {
            return await this.poiTypeService.updateGgSimilar(id, input.similar);
        } catch (error) {
            throw error;
        }
    }

    @Mutation("removePoiTypeSimilarItem")
    @Roles("isSuperUser")
    @UseInterceptors(new PoiTypeTransformInterceptor())
    async removePoiTypeSimilarItem(_: any, { id, input }) {
        try {
            return await this.poiTypeService.removeSimilarItem(id, input);
        } catch (error) {
            throw error;
        }
    }

    @Mutation("removePoiTypeGgSimilarItem")
    @Roles("isSuperUser")
    @UseInterceptors(new PoiTypeTransformInterceptor())
    async removePoiTypeGgSimilarItem(_: any, { id, input }) {
        try {
            return await this.poiTypeService.removeGgSimilarItem(id, input);
        } catch (error) {
            throw error;
        }
    }

    @Mutation("removePoiType")
    @Roles("isSuperUser")
    @UseInterceptors(new PoiTypeTransformInterceptor())
    async removePoiType(_: any, { id }) {
        try {
            return await this.poiTypeService.delete(id);
        } catch (error) {
            throw error;
        }
    }

    @Query("getPoiInfos")
    @Roles("isSuperUser")
    @UseInterceptors(new PoiInfoTransformInterceptor())
    async getPoiInfos(_: any, { opts }) {
        try {
            const myPoiInfos = await this.poiInfoService.findAll({
                curPage: opts.curPage,
                perPage: opts.perPage,
                q: opts.q,
                sort: opts.sort
            });
            return {
                items: plainToClass(PoiInfo, myPoiInfos.items),
                meta: myPoiInfos.meta
            };
        } catch (error) {
            throw error;
        }
    }

    @Mutation("changePoiType")
    @Roles("isSuperUser")
    @UseInterceptors(new PoiInfoTransformInterceptor())
    async changePoiType(_: any, { id, typeId }) {
        try {
            return await this.poiInfoService.changeType(id, typeId);
        } catch (error) {
            throw error;
        }
    }

    @Query("searchPoiTypes")
    @Roles("isSuperUser")
    @UseInterceptors(new PoiTypeSearchTransformInterceptor())
    async searchPoiTypes(_: any, { q }) {
        try {
            const response = await this.poiTypeService.search(q);
            return response;
        } catch (error) {
            throw error;
        }
    }

    @Mutation("uploadOctoparse")
    @Roles("isSuperUser")
    async uploadOctoparse(_: any, { file }) {
        try {
            return await this.poiInfoService.import(file);
        } catch (error) {
            throw error;
        }
    }

    @Mutation("changeStatus")
    @Roles("isSuperUser")
    @UseInterceptors(new PoiInfoTransformInterceptor())
    async changeStatus(_: any, { id, status }) {
        try {
            return await this.poiInfoService.changeStatus(id, status);
        } catch (error) {
            throw error;
        }
    }
}
