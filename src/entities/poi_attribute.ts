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

@Entity({ name: "poi_activity" })
export class PoiAttribute extends BaseEntity {
    @PrimaryGeneratedColumn({ name: "pat_id" })
    id: number;

    @IsNotEmpty()
    @Column({ name: "pat_name" })
    name: string;

    @Column({ name: "pat_date_created" })
    dateCreated: number;

    @Column({ name: "pat_date_modified" })
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
