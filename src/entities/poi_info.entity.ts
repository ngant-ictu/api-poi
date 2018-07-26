import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    OneToMany,
    JoinColumn,
    BeforeInsert,
    BeforeUpdate,
    BaseEntity
} from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { IsPoiAlreadyExist } from './validators/poi_info.is-already-exist';
import { PoiOpeningHours } from './poi_opening_hours.entity';

enum Status {
    ACTIVE = <number>1,
    DEACTIVE = <number>3
}

@Entity({ name: 'poi_info' })
export class PoiInfo extends BaseEntity {
    @Column({ name: 'pt_id' })
    ptid: number;

    @PrimaryGeneratedColumn({ name: 'pi_id' })
    id: number;

    @IsNotEmpty()
    @Column({ name: 'pi_name' })
    name: string;

    @Column({ name: 'pi_similiar' })
    similiar: string;

    @Column({ name: 'pi_number' })
    number: string;

    @Column({ name: 'pi_street' })
    street: string;

    @Column({ name: 'pi_ward' })
    ward: number;

    @Column({ name: 'pi_district' })
    district: number;

    @Column({ name: 'pi_city' })
    city: number;

    @Column({ name: 'pi_lat' })
    lat: string;

    @Column({ name: 'pi_lng' })
    lng: string;

    @Column({ name: 'pi_website' })
    website: string;

    @Column({ name: 'pi_phone_number' })
    phoneNumber: string;

    @Column({ name: 'pi_rating' })
    rating: string;

    @Column({ name: 'pi_status', enum: Status })
    status: number;

    @IsNotEmpty()
    @IsPoiAlreadyExist({ message: 'Poi already existed.' })
    @Column({ name: 'pi_slug' })
    slug: string;

    @Column({ name: 'pi_gg_place_id' })
    ggPlaceId: string;

    @Column({ name: 'pi_gg_map_id' })
    ggMapId: string;

    @Column({ name: 'pi_gg_full_address' })
    ggFullAddress: string;

    @Column({ name: 'pi_gg_total_review' })
    ggTotalReview: number;

    @Column({ name: 'pi_tags' })
    tags: string;

    @Column({ name: 'pi_date_created' })
    dateCreated: number;

    @Column({ name: 'pi_date_modified' })
    dateModified: number;

    // Relation 1 poi has n hours
    @OneToMany(type => PoiOpeningHours, hour => hour.poi)
    @JoinColumn({ name: 'poh_id' })
    openingHours: PoiOpeningHours[];

    @BeforeInsert()
    private createDate() {
        this.dateCreated = Math.floor(Date.now() / 1000);
    }

    @BeforeUpdate()
    private updateDate() {
        this.dateModified = Math.floor(Date.now() / 1000);
    }
}
