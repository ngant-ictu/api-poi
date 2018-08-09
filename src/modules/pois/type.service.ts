import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { PoiType } from "../../entities/poi_type.entity";
import { validate } from "class-validator";
import { ElasticsearchService } from "@nestjs/elasticsearch";
import * as bodybuilder from "bodybuilder";

@Injectable()
export class PoiTypeService {
    constructor(
        @InjectRepository(PoiType) private readonly typeRepository: Repository<PoiType>,
        private readonly searchService: ElasticsearchService
    ) {}

    async findAll(options: { curPage: number; perPage: number; q?: string; group?: number; sort?: string }) {
        try {
            let objects: [PoiType[], number];
            let qb = this.typeRepository.createQueryBuilder("poitype");

            if (options.q) {
                qb = qb.where("poitype.name like :q or poitype.similar like :q or poitype.id = :id", {
                    q: `%${options.q}%`,
                    id: options.q
                });
            }

            // sort
            options.sort =
                options.sort && new PoiType().hasOwnProperty(options.sort.replace("-", "")) ? options.sort : "-id";
            const field = options.sort.replace("-", "");
            if (options.sort) {
                if (options.sort[0] === "-") {
                    qb = qb.addOrderBy("poitype." + field, "DESC");
                } else {
                    qb = qb.addOrderBy("poitype." + field, "ASC");
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
            return await this.typeRepository.findOneOrFail(id);
        } catch (error) {
            throw error;
        }
    }

    async updateSimilar(id: number, similar: any) {
        try {
            let newSimilarArr = [];
            let myPoiType = await this.typeRepository.findOneOrFail(id);
            const oldSimilar = await myPoiType.similar.split(",").map(s => {
                return newSimilarArr.push(s);
            });
            const newSimilar = await similar.split(",").map(s => {
                return newSimilarArr.push(s.trim());
            });
            await Promise.all([oldSimilar, newSimilar]);

            myPoiType.similar = newSimilarArr.join(",");

            return await this.typeRepository.save(myPoiType);
        } catch (error) {
            throw error;
        }
    }

    async updateGgSimilar(id: number, similar: any) {
        try {
            let newSimilarArr = [];
            let myPoiType = await this.typeRepository.findOneOrFail(id);
            const oldSimilar = await myPoiType.ggSimilar.split(",").map(s => {
                return newSimilarArr.push(s);
            });
            const newSimilar = await similar.split(",").map(s => {
                return newSimilarArr.push(s.trim());
            });
            await Promise.all([oldSimilar, newSimilar]);

            myPoiType.ggSimilar = newSimilarArr.join(",");

            return await this.typeRepository.save(myPoiType);
        } catch (error) {
            throw error;
        }
    }

    async removeSimilarItem(id: number, similar: any) {
        try {
            let myPoiType = await this.typeRepository.findOneOrFail(id);

            let similarArr = myPoiType.similar.split(",");
            const index = similarArr.findIndex(similarName => similarName === similar.similarItem);
            similarArr.splice(index, 1);
            myPoiType.similar = similarArr.join(",");

            return await this.typeRepository.save(myPoiType);
        } catch (error) {
            throw error;
        }
    }

    async removeGgSimilarItem(id: number, similar: any) {
        try {
            let myPoiType = await this.typeRepository.findOneOrFail(id);

            let ggSimilarArr = myPoiType.ggSimilar.split(",");
            const index = ggSimilarArr.findIndex(similarName => similarName === similar.similarItem);
            ggSimilarArr.splice(index, 1);
            myPoiType.ggSimilar = ggSimilarArr.join(",");

            return await this.typeRepository.save(myPoiType);
        } catch (error) {
            throw error;
        }
    }

    async create(formData: any) {
        try {
            const myType = this.typeRepository.create(formData);

            const errors = await validate(myType, {
                validationError: { target: false }
            });

            if (errors.length === 0) {
                return await this.typeRepository.save(myType);
            }
        } catch (error) {
            throw error;
        }
    }

    async delete(id: number) {
        try {
            const myType = await this.typeRepository.findOneOrFail(id);

            return await myType.remove();
        } catch (error) {
            throw error;
        }
    }

    async search(q: string) {
        try {
            let qb = bodybuilder().query("multi_match", {
                query: q.trim(),
                fuzziness: 5,
                prefix_length: 0,
                type: "best_fields",
                fields: ["pt_name", "pt_similar", "pt_gg_similar"]
            });

            return await this.searchService.search({ index: "poi_type", body: qb.build() });
        } catch (error) {
            console.trace(error.message);
        }
    }

    async findOneBySimilar(name: string) {
        try {
            let qb = this.typeRepository.createQueryBuilder("poitype");
            qb.where('FIND_IN_SET("' + name + '", poitype.similar)');

            return await qb.getOne();
        } catch (error) {
            throw error;
        }
    }

    async findOneByGgSimilar(name: string) {
        try {
            let qb = this.typeRepository.createQueryBuilder("poitype");
            qb.where('FIND_IN_SET("' + name + '", poitype.ggSimilar)');

            return await qb.getOne();
        } catch (error) {
            throw error;
        }
    }
}
