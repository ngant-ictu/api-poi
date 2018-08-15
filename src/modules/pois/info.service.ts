import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { PoiInfo } from "../../entities/poi_info.entity";
import { validate } from "class-validator";
import { ElasticsearchService } from "@nestjs/elasticsearch";
import { ConfigService } from '../config.service';
import * as slug from "slug";
import * as fs from "fs";
import * as mkdirp from "mkdirp";
import * as xlsx from "node-xlsx";
import * as GoogleMaps from "@google/maps";
import { findAllChildProperties, findItem } from "../../helpers/adj";
import { dump } from "../../helpers/dump";
import { RegionsService } from "../regions/regions.service";
import { PoiOpeningHoursService } from "./opening_hours.service";
import { PoiTypeService } from "./type.service";
import { PoiNoteService } from "./note.service";

@Injectable()
export class PoiInfoService {
    constructor(
        @InjectRepository(PoiInfo) private readonly infoRepository: Repository<PoiInfo>,
        private readonly searchService: ElasticsearchService,
        private readonly configService: ConfigService,
        private readonly regionsService: RegionsService,
        private readonly poiOpeningHoursService: PoiOpeningHoursService,
        private readonly typeService: PoiTypeService,
        private readonly noteService: PoiNoteService
    ) {}

    async findAll(options: { curPage: number; perPage: number; q?: string; group?: number; sort?: string }) {
        try {
            let objects: [PoiInfo[], number];
            let qb = this.infoRepository.createQueryBuilder("poiinfo");
            qb = qb.leftJoinAndSelect("poiinfo.ward", "region1");
            qb = qb.leftJoinAndSelect("poiinfo.district", "region2");
            qb = qb.leftJoinAndSelect("poiinfo.city", "region3");
            qb = qb.leftJoinAndSelect("poiinfo.type", "poitype");
            qb = qb.leftJoinAndSelect("poiinfo.notes", "poinote");

            if (options.q) {
                qb = qb.where("poiinfo.name like :q or poiinfo.similar like :q or poiinfo.id = :id", {
                    q: `%${options.q}%`,
                    id: options.q
                });
            }

            // sort
            options.sort =
                options.sort && new PoiInfo().hasOwnProperty(options.sort.replace("-", "")) ? options.sort : "-id";
            const field = options.sort.replace("-", "");
            if (options.sort) {
                if (options.sort[0] === "-") {
                    qb = qb.addOrderBy("poiinfo." + field, "DESC");
                } else {
                    qb = qb.addOrderBy("poiinfo." + field, "ASC");
                }
            }

            // offset & limit
            qb = qb.skip((options.curPage - 1) * options.perPage).take(options.perPage);

            // run query
            objects = await qb.getManyAndCount();

            return {
                items: objects[0],
                meta: {
                    curPage: options.curPage,
                    perPage: options.perPage,
                    totalPages: options.perPage > objects[1] ? 1 : Math.ceil(objects[1] / options.perPage),
                    totalResults: objects[1]
                }
            };
        } catch (error) {
            throw error;
        }
    }

    async findOne(id: number) {
        try {
            return await this.infoRepository.findOneOrFail({
                where: { id: id },
                join: {
                    alias: "poiinfo",
                    leftJoinAndSelect: {
                        region1: "poiinfo.ward",
                        region2: "poiinfo.district",
                        region3: "poiinfo.city",
                        poitype: "poiinfo.type",
                        poinote: "poiinfo.notes"
                    }
                }
            });
        } catch (error) {
            throw error;
        }
    }

    async create(formData: any) {
        let myInfo;
        myInfo = this.infoRepository.create(formData);

        const errors = await validate(myInfo, {
            validationError: { target: false }
        });

        if (errors.length > 0) {
            myInfo = await this.infoRepository.findOne({
                slug: formData.slug
            });
        } else {
            myInfo = await this.infoRepository.save(myInfo);
        }

        return myInfo;
    }

    async update(id: number, formData: any) {
        try {
            let myPoiInfo = await this.infoRepository.findOneOrFail(id);
            myPoiInfo.name = formData.name;
            myPoiInfo.number = formData.number;
            myPoiInfo.street = formData.street;
            myPoiInfo.phoneNumber = formData.phoneNumber;

            if (formData.region.length > 0) {
                myPoiInfo.city = (typeof formData.region[0] !== 'undefined') ? formData.region[0] : null;
                myPoiInfo.district = (typeof formData.region[1] !== 'undefined') ? formData.region[1] : null;
                myPoiInfo.ward = (typeof formData.region[2] !== 'undefined') ? formData.region[2] : null;
            }

            await this.infoRepository.save(myPoiInfo);
            return await this.infoRepository.findOneOrFail({
                where: { id: id },
                join: {
                    alias: "poiinfo",
                    leftJoinAndSelect: {
                        region1: "poiinfo.ward",
                        region2: "poiinfo.district",
                        region3: "poiinfo.city",
                        poitype: "poiinfo.type",
                        poinote: "poiinfo.notes"
                    }
                }
            });
        } catch (error) {
            throw error;
        }
    }

    async changeType(id: number, typeId: number) {
        try {
            let myPoiInfo = await this.infoRepository.findOneOrFail(id);
            myPoiInfo.type = typeId;

            await this.infoRepository.save(myPoiInfo);
            return await this.infoRepository.findOneOrFail({
                where: { id: id },
                join: {
                    alias: "poiinfo",
                    leftJoinAndSelect: {
                        region1: "poiinfo.ward",
                        region2: "poiinfo.district",
                        region3: "poiinfo.city",
                        poitype: "poiinfo.type",
                        poinote: "poiinfo.notes"
                    }
                }
            });
        } catch (error) {
            throw error;
        }
    }

    async changeStatus(id: number, status: number) {
        try {
            let myPoiInfo = await this.infoRepository.findOneOrFail(id);
            myPoiInfo.status = status;

            await this.infoRepository.save(myPoiInfo);
            return await this.infoRepository.findOneOrFail({
                where: { id: id },
                join: {
                    alias: "poiinfo",
                    leftJoinAndSelect: {
                        region1: "poiinfo.ward",
                        region2: "poiinfo.district",
                        region3: "poiinfo.city",
                        poitype: "poiinfo.type",
                        poinote: "poiinfo.notes"
                    }
                }
            });
        } catch (error) {
            throw error;
        }
    }

    async import(file: any) {
        try {
            console.log("Uploading...");
            const { stream, filename } = await file;
            const octoparseDir = this.configService.get("octoparse").directory;
            const uploadDir = `${process.cwd()}/${octoparseDir}`;
            mkdirp(uploadDir);
            const filePath = `${uploadDir}/${filename}`;

            if (fs.existsSync(filePath)) {
                console.log("File already existed.");
                return;
            }

            await new Promise(resolve => {
                stream.pipe(fs.createWriteStream(filePath)).on("finish", async () => {
                    let count = 0;
                    console.log("Upload completed.");
                    const googleMapsClient = await GoogleMaps.createClient({
                        key: process.env.GOOGLE_API_KEY,
                        Promise: Promise
                    });

                    // Parse a file
                    console.log("Parsing file...");
                    const workSheetsFromFile = await xlsx.parse(filePath);
                    const data = workSheetsFromFile[0].data;
                    console.log("Parse completed.");

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

                    console.log("Begin importing...");

                    data.map(async (item, key) => {
                        count++;

                        // Exclude title field
                        if (key >= 1) {
                            if (item[0].length > 0) {
                                let responseSearch: any = null;
                                // request gg places API to get place_id using in gg place detail API
                                responseSearch = await googleMapsClient
                                    .places({ query: item[0], language: "vi" })
                                    .asPromise();

                                let international_phone_number = "";

                                // May be gg place return more than 1 record / get 1 first
                                const place = responseSearch.json.results[0];

                                if (typeof place !== "undefined") {
                                    // Get info of 1 place
                                    const responsePlace = await googleMapsClient
                                        .place({ placeid: place.place_id, language: "vi" })
                                        .asPromise();

                                    if (typeof responsePlace.json.result.international_phone_number !== "undefined") {
                                        international_phone_number =
                                            responsePlace.json.result.international_phone_number;
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
                                        website,
                                        types
                                    } = responsePlace.json.result;

                                    // select GG type in db
                                    let type: number = 0;
                                    const myType = await this.typeService.findOneByGgSimilar(item[1]);
                                    if (myType) {
                                        type = myType.id;
                                    }

                                    // reject if not in Vietnam +84
                                    if (
                                        international_phone_number.match(/\+84\s?\d+/g) !== null ||
                                        international_phone_number === ""
                                    ) {
                                        let parsedAddr = await this._parseAddr(address_components);
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
                                            type: type,
                                            name: name, // entity: item[1],
                                            slug: slug(name, {
                                                lower: true
                                            }),
                                            number: parsedAddr.streetNumber,
                                            street: parsedAddr.streetName,
                                            lat: geometry.location.lat,
                                            lng: geometry.location.lng,
                                            rating: rating,
                                            phoneNumber: international_phone_number,
                                            website: website,
                                            ggPlaceId: place_id,
                                            ggFullAddress: formatted_address,
                                            status: 3
                                        };

                                        // get district & ward follow by district
                                        const myDistrict = await this.regionsService.findDistrictByName(
                                            parsedAddr.districtName
                                        );
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
                                            const myPoiInfo = await this.create(poiDataToWrite);

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
                                }
                            }
                        }
                    });
                    console.log("TOTAL: " + count);
                });
            });

            return 1;
        } catch (error) {
            throw error;
        }
    }

    ///////////////// FUNCTION //////////////////

    private _parseAddr(addressComponent: any) {
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

    private _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
