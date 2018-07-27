import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PoiType } from '../../entities/poi_type.entity';
import { validate } from 'class-validator';

@Injectable()
export class PoiTypeService {
    constructor(@InjectRepository(PoiType) private readonly typeRepository: Repository<PoiType>) {}

    async findAll(options: {
        curPage: number;
        perPage: number;
        q?: string;
        group?: number;
        sort?: string;
    }) {
        try {
            let objects: [PoiType[], number];
            let qb = this.typeRepository.createQueryBuilder('poitype');

            if (options.q) {
                qb = qb.where('poitype.name like :q or poitype.similar like :q or poitype.id = :id', {
                    q: `%${options.q}%`, id: options.q
                });
            }

            // sort
            options.sort = options.sort && (new PoiType()).hasOwnProperty(options.sort.replace('-', '')) ? options.sort : '-id';
            const field = options.sort.replace('-', '');
            if (options.sort) {
                if (options.sort[0] === '-') {
                    qb = qb.addOrderBy('poitype.' + field, 'DESC');
                } else {
                    qb = qb.addOrderBy('poitype.' + field, 'ASC');
                }
            }

            // offset & limit
            qb = qb.skip((options.curPage - 1) * options.perPage)
                .take(options.perPage);

            // run query
            objects = await qb.getManyAndCount();

            return {
                types: objects[0],
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
            const myPoiType = await this.typeRepository.findOneOrFail(id);
            const oldSimilar = await myPoiType.similar.split(',').map(s => { return newSimilarArr.push(s) });
            const newSimilar = await similar.split(',').map(s => { return newSimilarArr.push(s) })
            await Promise.all([
                oldSimilar,
                newSimilar
            ]);

            myPoiType.similar = newSimilarArr.join(',');

            return await this.typeRepository.save(myPoiType);
        } catch (error) {
            throw error;
        }
    }

    async create(formData: any) {
        const myType = this.typeRepository.create(formData);

        const errors = await validate(myType, {
            validationError: { target: false }
        });

        if (errors.length === 0) {
            return await this.typeRepository.save(myType);
        }
    }
}
