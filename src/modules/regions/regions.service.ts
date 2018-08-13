import { Injectable } from "@nestjs/common";
import { Repository, Brackets, getManager } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Region } from "../../entities/region.entity";

@Injectable()
export class RegionsService {
    constructor(@InjectRepository(Region) private readonly regionRepository: Repository<Region>) {}

    async create(formData: any) {
        const myRegion = this.regionRepository.create(formData);

        return await this.regionRepository.save(myRegion);
    }

    async findCityByName(cityName: string) {
        return await this.regionRepository
            .createQueryBuilder("r")
            .where("r.name = :name1", { name1: `${cityName}` })
            .orWhere("r.name = :name2", { name2: `Thành phố ${cityName}` })
            .orWhere("r.name = :name3", { name3: `Thành Phố ${cityName}` })
            .orWhere("r.name = :name3", { name3: `Tỉnh ${cityName}` })
            .orWhere("r.name = :name3", { name3: `tỉnh ${cityName}` })
            .getOne();
    }

    async findDistrictByName(districtName: string) {
        return await this.regionRepository
            .createQueryBuilder("r")
            .where("r.name = :name1", { name1: `${districtName}` })
            .orWhere("r.name = :name2", { name2: `Quận ${districtName}` })
            .orWhere("r.name = :name3", { name3: `Huyện ${districtName}` })
            .getOne();
    }

    async findWardByName(wardName: string, districtId: number) {
        return await this.regionRepository
            .createQueryBuilder("r")
            .where("r.parent = :districtId", { districtId: districtId })
            .andWhere(
                new Brackets(qb => {
                    qb.where("r.name = :name1", { name1: `${wardName}` })
                        .orWhere("r.name = :name2", {
                            name2: `Phường ${wardName}`
                        })
                        .orWhere("r.name = :name3", { name3: `Xã ${wardName}` })
                        .orWhere("r.name = :name4", {
                            name4: `Thị Xã ${wardName}`
                        })
                        .orWhere("r.name = :name5", {
                            name5: `Thị xã ${wardName}`
                        });
                })
            )
            .getOne();
    }

    async findAll(formData: any) {
        return await this.regionRepository.find(formData);
    }

}
