import { UseInterceptors, UseGuards, BadRequestException } from "@nestjs/common";
import { Resolver, Query, Mutation } from "@nestjs/graphql";
import { AuthGuard } from "../../guards/auth.guard";
import { Roles } from "../../decorators/roles.decorator";
import { PoiInfoService } from "./info.service";
import { RegionsService } from "../regions/regions.service";
import { PoiOpeningHoursService } from "./opening_hours.service";
import { PoiTypeService } from "./type.service";
import { PoiType } from "../../entities/poi_type.entity";
import * as GoogleMaps from "@google/maps";
import * as slug from "slug";
import * as fs from "fs";
import * as xlsx from "node-xlsx";
import { dump } from "../../helpers/dump";
import * as bodybuilder from "bodybuilder";
import { findAllChildProperties, findItem } from "../../helpers/adj";
import { plainToClass } from "class-transformer";
import { PoiTypeTransformInterceptor } from "../../interceptors/poi_type-transform.interceptor";
import { PoiTypeSearchTransformInterceptor } from "../../interceptors/poi_type-search-transform.interceptor";
import { PoiInfoTransformInterceptor } from "../../interceptors/poi_info-transform.interceptor";
import { PoiInfo } from "../../entities/poi_info.entity";

@Resolver("Poi")
@UseGuards(AuthGuard)
export class PoisResolver {
    constructor(
        private readonly poiInfoService: PoiInfoService,
        private readonly regionsService: RegionsService,
        private readonly poiOpeningHoursService: PoiOpeningHoursService,
        private readonly poiTypeService: PoiTypeService
    ) {}

    @Mutation("importPoi")
    @Roles("isSuperUser")
    async importFromOctoparse() {
        let count: number = 0;
        const googleMapsClient = GoogleMaps.createClient({
            key: process.env.GOOGLE_API_KEY,
            Promise: Promise
        });

        // Parse a file
        const workSheetsFromFile = xlsx.parse(`${process.cwd()}/src/storage/data/phong-giao-dich.xlsx`);
        const data = workSheetsFromFile[0].data;

        // get all district and city to except in regex ward list
        const myRegions = await this.regionsService.findAll({
            where: {
                parent: 0
            },
            relations: ["children"],
            cache: true
        });

        let districtAndCityExclude = [];
        const cityList = myRegions.map(r => r.id);
        cityList.map(cityId => {
            const root = findItem(myRegions, "id", cityId);
            let kids = findAllChildProperties(root.children, "children", "name");
            districtAndCityExclude = districtAndCityExclude.concat(kids);
        });

        districtAndCityExclude = districtAndCityExclude.concat(myRegions.map(r => r.name));

        data.map(async (item, key) => {
            await PoisResolver.sleep(5000);

            // Exclude title field
            if (key >= 1) {
                if (item[0].length > 0) {
                    let responseSearch: any = null;

                    // request gg places API to get place_id using in gg place detail API
                    responseSearch = await googleMapsClient
                        .places({
                            query: item[0],
                            language: "vi"
                        })
                        .asPromise();

                    // if (responseSearch.json.results.length === 0) {
                    //   // request gg geocode to get address (not include opening hours)
                    //   responseSearch = await googleMapsClient.geocode({
                    //     address: item[2],
                    //     language: 'vi',
                    //   }).asPromise();
                    // }

                    let international_phone_number = "";

                    // May be gg place return more than 1 record
                    responseSearch.json.results.map(async place => {
                        await PoisResolver.sleep(5000);

                        // Get info of 1 place
                        const responsePlace = await googleMapsClient
                            .place({
                                placeid: place.place_id,
                                language: "vi"
                            })
                            .asPromise();

                        if (typeof responsePlace.json.result.international_phone_number !== "undefined") {
                            international_phone_number = responsePlace.json.result.international_phone_number;
                        }

                        const {
                            name,
                            address_components,
                            formatted_address,
                            geometry,
                            opening_hours,
                            place_id,
                            rating,
                            url,
                            website
                        } = responsePlace.json.result;

                        // reject if not in Vietnam +84
                        if (
                            international_phone_number.match(/\+84\s?\d+/g) !== null ||
                            international_phone_number === ""
                        ) {
                            let parsedAddr = await PoisResolver.parseAddr(address_components);
                            // console.log(formatted_address);

                            // find ward if not in gg data
                            if (parsedAddr.wardName === "") {
                                const wardRe = new RegExp(
                                    "(?:Phường|Xã)s?((?!" + districtAndCityExclude.join("|") + ").)+,",
                                    "g"
                                ); // Need get end commas to parse with address not match
                                const wardMatches = formatted_address.match(wardRe);
                                if (wardMatches !== null) {
                                    const matchesArr = wardMatches[0].split(",");
                                    parsedAddr.wardName = matchesArr[0];
                                }
                            }

                            // dump(parsedAddr)
                            let poiDataToWrite = {
                                name: name,
                                // entity: item[1],
                                slug: slug(name, { lower: true }),
                                number: parsedAddr.streetNumber,
                                street: parsedAddr.streetName,
                                lat: geometry.location.lat,
                                lng: geometry.location.lng,
                                rating: rating,
                                phoneNumber: international_phone_number,
                                website: website,
                                ggPlaceId: place_id,
                                ggFullAddress: formatted_address
                            };

                            // get district & ward follow by district
                            const myDistrict = await this.regionsService.findDistrictByName(parsedAddr.districtName);
                            if (typeof myDistrict !== "undefined") {
                                poiDataToWrite["district"] = myDistrict.id;

                                const myWard = await this.regionsService.findWardByName(
                                    parsedAddr.wardName,
                                    myDistrict.id
                                );
                                if (typeof myWard !== "undefined") {
                                    poiDataToWrite["ward"] = myWard.id;
                                }
                            }

                            // get city
                            const myCity = await this.regionsService.findCityByName(parsedAddr.cityName);
                            if (typeof myCity !== "undefined") {
                                poiDataToWrite["city"] = myCity.id;
                            } else {
                                // get city from parent id of district
                                if (typeof myDistrict !== "undefined") {
                                    poiDataToWrite["city"] = myDistrict.parent;
                                }
                            }

                            // get google map id https://maps.google.com/?cid=<ggMapId>
                            const ggMapMatches = url.match(/cid=(\d+)/i);
                            if (ggMapMatches !== null) {
                                poiDataToWrite["ggMapId"] = ggMapMatches[1];
                            }

                            try {
                                const myPoiInfo = await this.poiInfoService.create(poiDataToWrite);

                                count++;

                                // get opening hours
                                if (typeof opening_hours !== "undefined") {
                                    if (
                                        opening_hours.periods.length === 1 &&
                                        opening_hours.periods[0].open.day === 0 &&
                                        opening_hours.periods[0].open.time === "0000"
                                    ) {
                                        await this.poiOpeningHoursService.create({
                                            piid: myPoiInfo.id,
                                            open: "0000",
                                            day: "0"
                                        });

                                        console.log(`#${myPoiInfo.id} ${myPoiInfo.name} work full times!`);
                                    } else {
                                        opening_hours.periods.map(async hour => {
                                            await this.poiOpeningHoursService.create({
                                                piid: myPoiInfo.id,
                                                open: hour.open.time,
                                                close: hour.close.time,
                                                day: hour.close.day
                                            });
                                        });
                                    }
                                } else {
                                    console.log(`---   Place: "${item[0]}" has no work times!   ---`);
                                }
                            } catch (err) {
                                console.log(`###   Place can not created: "${item[0]}"  ###`);
                                throw err;
                            }
                        } else {
                            console.log(`XXX   Place not in Vietnam: "${item[0]}"  XXX`);
                        }
                    });
                }
            }
        });

        return count;
    }

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
                    const dataSimiliar = row.map((col, index) => (index >= 1 ? col : null));
                    const typeSimilar = dataSimiliar.filter(obj => obj).join(",");
                    const typeName = row[0];

                    try {
                        await this.poiTypeService.create({
                            name: typeName,
                            similiar: typeSimilar
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
        const { stream, filename, mimetype, encoding } = await file;
        console.dir(filename);

        // const uploadDir = `${process.cwd()}/src/storage`;
        // const id = shortid.generate();
        // const path = `${uploadDir}/${id}-${filename}`;
        // return new Promise((resolve, reject) =>
        //     stream
        //         .on("error", error => {
        //             if (stream.truncated)
        //                 // Delete the truncated file
        //                 fs.unlinkSync(path);
        //             reject(error);
        //         })
        //         .pipe(fs.createWriteStream(path))
        //         .on("error", error => reject(error))
        //         .on("finish", () => resolve({ id, path }))
        // );
    }

    ///////////////// FUNCTION //////////////////

    private static parseAddr(addressComponent: any) {
        const streetNumber = addressComponent
            .map(item => {
                if (
                    typeof item.types[0] !== "undefined" &&
                    (item.types[0] === "street_number" || item.types[0] === "premise")
                )
                    return item.long_name;
            })
            .filter(obj => obj)
            .join("");

        const streetName = addressComponent
            .map(item => {
                if (typeof item.types[0] !== "undefined" && item.types[0] === "route") return item.long_name;
            })
            .filter(obj => obj)
            .join("");

        const wardName = addressComponent
            .map(item => {
                if (typeof item.types[0] !== "undefined" && item.types[0] === "sublocality_level_1") {
                    return item.long_name;
                }
            })
            .filter(obj => obj)
            .join("");

        const districtName = addressComponent
            .map(item => {
                if (typeof item.types[0] !== "undefined" && item.types[0] === "administrative_area_level_2")
                    return item.long_name;
            })
            .filter(obj => obj)
            .join("");

        const cityName = addressComponent
            .map(item => {
                if (typeof item.types[0] !== "undefined" && item.types[0] === "administrative_area_level_1")
                    return item.long_name;
            })
            .filter(obj => obj)
            .join("");

        return {
            streetNumber,
            streetName,
            wardName,
            districtName,
            cityName
        };
    }

    private static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
