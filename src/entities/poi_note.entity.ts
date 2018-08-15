import {
    Entity,
    Column,
    ManyToOne,
    JoinColumn,
    PrimaryGeneratedColumn,
    BeforeInsert,
    BeforeUpdate,
    BaseEntity
} from "typeorm";
import { IsNotEmpty } from "class-validator";
import { PoiInfo } from "./poi_info.entity";

@Entity({ name: "poi_note" })
export class PoiNote extends BaseEntity {
    @IsNotEmpty()
    @Column({ name: "pi_id" })
    piid: string;

    @PrimaryGeneratedColumn({ name: "pn_id" })
    id: number;

    @IsNotEmpty()
    @Column({ name: "pn_text" })
    text: string;

    @Column({ name: "pn_date_created" })
    dateCreated: number;

    @Column({ name: "pn_date_modified" })
    dateModified: number;

    // Relation n note of 1 poi
    @ManyToOne(type => PoiInfo, poi => poi.notes)
    @JoinColumn({ name: "pi_id" })
    poi: PoiInfo;

    @BeforeInsert()
    private createDate() {
        this.dateCreated = Math.floor(Date.now() / 1000);
    }

    @BeforeUpdate()
    private updateDate() {
        this.dateModified = Math.floor(Date.now() / 1000);
    }
}
