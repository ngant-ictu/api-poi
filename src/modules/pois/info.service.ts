import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { PoiInfo } from "../../entities/poi_info.entity";
import { validate } from "class-validator";
import { ElasticsearchService } from "@nestjs/elasticsearch";

@Injectable()
export class PoiInfoService {
    constructor(
        @InjectRepository(PoiInfo) private readonly infoRepository: Repository<PoiInfo>,
        private readonly searchService: ElasticsearchService
    ) {}

    async findAll(options: { curPage: number; perPage: number; q?: string; group?: number; sort?: string }) {
        try {
            let objects: [PoiInfo[], number];
            let qb = this.infoRepository.createQueryBuilder("poiinfo");
            qb = qb.leftJoinAndSelect("poiinfo.ward", "region1");
            qb = qb.leftJoinAndSelect("poiinfo.district", "region2");
            qb = qb.leftJoinAndSelect("poiinfo.city", "region3");
            qb = qb.leftJoinAndSelect("poiinfo.type", "poitype");

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
                        poitype: "poiinfo.type"
                    }
                }
            });
        } catch (error) {
            throw error;
        }
    }
}
