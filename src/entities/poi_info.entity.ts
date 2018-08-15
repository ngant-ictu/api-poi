import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    OneToMany,
    OneToOne,
    JoinColumn,
    BeforeInsert,
    BeforeUpdate,
    BaseEntity
} from "typeorm";
import { IsNotEmpty } from "class-validator";
import { IsPoiAlreadyExist } from './validators/poi_info.is-already-exist';
import { PoiOpeningHours } from "./poi_opening_hours.entity";
import { Region } from "./region.entity";
import { PoiType } from "./poi_type.entity";
import { PoiNote } from "./poi_note.entity";

enum Status {
    ACTIVE = <number>1,
    DEACTIVE = <number>3
}

@Entity({ name: "poi_info" })
export class PoiInfo extends BaseEntity {
    @Column({ name: "pt_id" })
    @OneToOne(type => PoiType)
    @JoinColumn({ name: "pt_id" })
    public type: number;

    @PrimaryGeneratedColumn({ name: "pi_id" })
    public id: number;

    @IsNotEmpty()
    @Column({ name: "pi_name" })
    public name: string;

    @Column({ name: "pi_similar" })
    public similar: string;

    @Column({ name: "pi_number" })
    public number: string;

    @Column({ name: "pi_street" })
    public street: string;

    @Column({ name: "pi_ward" })
    @OneToOne(type => Region)
    @JoinColumn({ name: "pi_ward" })
    public ward: number;

    @Column({ name: "pi_district" })
    @OneToOne(type => Region)
    @JoinColumn({ name: "pi_district" })
    public district: number;

    @Column({ name: "pi_city" })
    @OneToOne(type => Region)
    @JoinColumn({ name: "pi_city" })
    public city: number;

    @Column({ name: "pi_lat" })
    public lat: string;

    @Column({ name: "pi_lng" })
    public lng: string;

    @Column({ name: "pi_website" })
    public website: string;

    @Column({ name: "pi_phone_number" })
    public phoneNumber: string;

    @Column({ name: "pi_rating" })
    public rating: string;

    @Column({ name: "pi_status", enum: Status })
    public status: number;

    @IsNotEmpty()
    @IsPoiAlreadyExist({ message: "Poi already existed." })
    @Column({ name: "pi_slug" })
    public slug: string;

    @Column({ name: "pi_gg_place_id" })
    public ggPlaceId: string;

    @Column({ name: "pi_gg_map_id" })
    public ggMapId: string;

    @Column({ name: "pi_gg_full_address" })
    public ggFullAddress: string;

    @Column({ name: "pi_gg_total_review" })
    public ggTotalReview: number;

    @Column({ name: "pi_tags" })
    public tags: string;

    @Column({ name: "pi_date_created" })
    public dateCreated: number;

    @Column({ name: "pi_date_modified" })
    public dateModified: number;

    // Relation 1 poi has n hours
    @OneToMany(type => PoiOpeningHours, hour => hour.poi)
    @JoinColumn({ name: "poh_id" })
    public openingHours: PoiOpeningHours[];

    // Relation 1 poi has n notes
    @OneToMany(type => PoiNote, note => note.poi)
    @JoinColumn({ name: "pn_id" })
    public notes: PoiNote[];

    @BeforeInsert()
    private createDate() {
        this.dateCreated = Math.floor(Date.now() / 1000);
    }

    @BeforeUpdate()
    private updateDate() {
        this.dateModified = Math.floor(Date.now() / 1000);
    }
}
