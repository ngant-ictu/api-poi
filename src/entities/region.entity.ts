import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, BaseEntity } from 'typeorm';
import { IsNotEmpty, IsInt } from 'class-validator';

@Entity({ name: 'region' })
export class Region extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'r_id' })
    id: number;

    @IsNotEmpty()
    @Column({ name: 'r_name' })
    name: string;

    @Column({ name: 'r_slug' })
    slug: string;

    @Column({ name: 'r_order' })
    order: number;

    @ManyToOne(type => Region, region => region.children)
    @JoinColumn({ name: 'r_parent_id' })
    parent: Region;

    @OneToMany(type => Region, region => region.parent)
    children: Region[];
}
