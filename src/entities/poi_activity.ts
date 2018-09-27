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
export class PoiActivity extends BaseEntity {
    @PrimaryGeneratedColumn({ name: "pa_id" })
    id: number;

    @IsNotEmpty()
    @Column({ name: "pa_name" })
    name: string;

    @Column({ name: "pa_date_created" })
    dateCreated: number;

    @Column({ name: "pa_date_modified" })
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
