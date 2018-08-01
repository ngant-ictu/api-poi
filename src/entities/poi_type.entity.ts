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
import { IsTypeAlreadyExist } from "./validators/poi_type.is-already-exist";

@Entity({ name: "poi_type" })
export class PoiType extends BaseEntity {
    @PrimaryGeneratedColumn({ name: "pt_id" })
    id: number;

    @IsNotEmpty()
    @IsTypeAlreadyExist({ message: "Type already existed." })
    @Column({ name: "pt_name" })
    name: string;

    @Column({ name: "pt_similar" })
    similar: string;

    @Column({ name: "pt_date_created" })
    dateCreated: number;

    @Column({ name: "pt_date_modified" })
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
