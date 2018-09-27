import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    OneToMany,
    JoinColumn,
    BeforeInsert,
    BeforeUpdate,
    BaseEntity
} from "typeorm";
import { IsNotEmpty } from "class-validator";

@Entity({ name: "poi_product" })
export class PoiProduct extends BaseEntity {
    @PrimaryGeneratedColumn({ name: "pp_id" })
    id: number;

    @IsNotEmpty()
    @Column({ name: "pp_name" })
    name: string;

    @Column({ name: "pp_similar" })
    similar: string;

    @Column({ name: "pp_slug" })
    slug: string;

    @Column({ name: "pp_date_created" })
    dateCreated: number;

    @Column({ name: "pp_date_modified" })
    dateModified: number;

    @BeforeInsert()
    private createDate() {
        this.dateCreated = Math.floor(Date.now() / 1000);
    }

    @BeforeUpdate()
    private updateDate() {
        this.dateModified = Math.floor(Date.now() / 1000);
    }
}
