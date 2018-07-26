import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BeforeInsert,
    BeforeUpdate,
    BaseEntity,
    JoinTable,
    ManyToMany
} from 'typeorm';
import { IsNotEmpty, IsEmail, IsIn, validate } from 'class-validator';
import { IsUserAlreadyExist } from './validators/user.is-already-exist';
import * as hashers from 'node-django-hashers';
import { ValidateError } from '../filters/error/validate-exception.error';

@Entity({ name: 'user' })
export class User extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'u_id' })
    public id: number = 0;

    @Column({ name: 'u_full_name' })
    public fullName: string = '';

    @Column({ name: 'u_email' })
    @IsNotEmpty({ message: 'Email is not empty' })
    @IsEmail()
    @IsUserAlreadyExist({ message: 'User already existed.' })
    public email: string = '';

    @Column({ name: 'u_password' })
    @IsNotEmpty({ message: 'Password is not empty' })
    public password: string = '';

    @Column({ name: 'u_avatar' })
    public avatar: string = '';

    @Column({ name: 'u_status' })
    public status: number = 0;

    @Column({ name: 'u_is_super_user' })
    public isSuperUser: number = 0;

    @Column({ name: 'u_is_staff' })
    public isStaff: number = 0;

    @Column({ name: 'u_date_created' })
    public dateCreated: number = 0;

    @Column({ name: 'u_date_modified' })
    public dateModified: number = 0;

    public static IS_SUPER_USER: number = 1;
    public static IS_NOT_SUPER_USER: number = 3;
    public static IS_STAFF: number = 1;
    public static IS_NOT_STAFF: number = 3;
    public static STATUS_ACTIVE: number = 1;
    public static STATUS_BLOCKED: number = 3;

    @BeforeInsert()
    private async doBeforeInsertion() {
        this.dateCreated = Math.floor(Date.now() / 1000);

        const h = new hashers.PBKDF2PasswordHasher();
        const hash = await h.encode(this.password, h.salt());
        this.password = hash;

        const errors = await validate(this, {
            validationError: { target: false }
        });
        if (errors.length > 0) {
            throw new ValidateError(errors);
        }
    }

    @BeforeUpdate()
    private async doBeforeUpdate() {
        this.dateModified = Math.floor(Date.now() / 1000);

        const errors = await validate(this, {
            validationError: { target: true },
            skipMissingProperties: true
        });
        if (errors.length > 0) {
            throw errors;
        }
    }

    public async comparePassword(password: string) {
        const h = new hashers.PBKDF2PasswordHasher();
        return await h.verify(password, this.password);
    }

    public getStatusName() {
        let name: string = '';

        switch (this.status) {
            case User.STATUS_ACTIVE:
                name = 'Active';
                break;
            case User.STATUS_BLOCKED:
                name = 'Blocked';
                break;
        }

        return name;
    }
}
