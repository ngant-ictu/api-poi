import { UseInterceptors, UseGuards, BadRequestException } from "@nestjs/common";
import { Resolver, Query, Mutation } from "@nestjs/graphql";
import { AuthGuard } from "../../guards/auth.guard";
import { Roles } from "../../decorators/roles.decorator";
import { RegionsService } from "./regions.service";
import * as xlsx from "node-xlsx";
import { dump } from "../../helpers/dump";
import { listToTree } from "../../helpers/adj";

@Resolver("Region")
@UseGuards(AuthGuard)
export class RegionsResolver {
    constructor(private readonly regionsService: RegionsService) {}

    @Mutation("importRegion")
    @Roles("administrator")
    async importRegion() {
        let count: number = 0;

        const workSheetsFromFile = xlsx.parse(`${process.cwd()}/src/storage/data/region.xlsx`);
        const data = workSheetsFromFile[0].data;

        await Promise.all(
            data.map(async item => {
                const region = {
                    id: item[0],
                    name: item[1],
                    slug: item[2],
                    order: item[3],
                    parent: item[4]
                };

                try {
                    await this.regionsService.create(region);
                } catch (err) {
                    throw new BadRequestException(err);
                }

                count++;
            })
        );

        console.log("TOTAL REGION IMPORTED: " + count);

        return {
            count
        };
    }

    @Query("getTrees")
    @Roles("isSuperUser")
    async getTrees(_: any) {
        try {
            let output = [];
            const myRegions = await this.regionsService.findAll({
                cache: true
            });

            return await Promise.all(
                output = listToTree(myRegions)
            );
        } catch (error) {
            throw error;
        }
    }
}
