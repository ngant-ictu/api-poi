import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    BeforeInsert,
    BeforeUpdate,
    BaseEntity
} from 'typeorm';
import { IsNotEmpty, IsInt } from 'class-validator';
import { PoiInfo } from './poi_info.entity';

@Entity({ name: 'poi_opening_hours' })
export class PoiOpeningHours extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'poh_id' })
    id: number;

    @IsNotEmpty()
    @Column({ name: 'pi_id' })
    piid: number;

    @IsNotEmpty()
    @Column({ name: 'poh_open' })
    open: string;

    @Column({ name: 'poh_close' })
    close: string;

    @Column({ name: 'poh_day' })
    day: number;

    @Column({ name: 'poh_date_created' })
    dateCreated: number;

    @Column({ name: 'poh_date_modified' })
    dateModified: number;

    // Relation n hours of 1 poi
    @ManyToOne(type => PoiInfo, poi => poi.openingHours)
    @JoinColumn({ name: 'pi_id' })
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
