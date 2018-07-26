import { UseInterceptors, UseGuards } from '@nestjs/common';
import { Query, Mutation, Resolver, ResolveProperty } from '@nestjs/graphql';
import { RavenInterceptor } from 'nest-raven';
import { AuthGuard } from '../../guards/auth.guard';
import { Roles } from '../../decorators/roles.decorator';
import { UsersService } from './users.service';
import { User } from '../../entities/user.entity';
import { plainToClass } from 'class-transformer';
import { UserTransformInterceptor } from '../../interceptors/user-transform.interceptor';

import * as shortid from 'shortid';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';

@Resolver('User')
@UseGuards(AuthGuard)
export class UsersResolver {
    constructor(private readonly usersService: UsersService) {}

    @Query('getUsers')
    @Roles('isSuperUser')
    // @UseInterceptors(RavenInterceptor())
    @UseInterceptors(new UserTransformInterceptor())
    async getUsers(_: any, { opts }) {
        try {
            const myUsers = await this.usersService.findAll({
                curPage: opts.curPage,
                perPage: opts.perPage,
                q: opts.q,
                sort: opts.sort
            });
            return {
                users: plainToClass(User, myUsers.users),
                meta: myUsers.meta
            };
        } catch (error) {
            throw error;
        }
    }

    @Query('getUser')
    @Roles('isSuperUser')
    @UseInterceptors(new UserTransformInterceptor())
    async getUser(_: any, { id }) {
        try {
            const myUser = await this.usersService.findOne(id);
            return plainToClass(User, myUser);
        } catch (error) {
            throw error;
        }
    }

    @Mutation('createUser')
    @Roles('isSuperUser')
    async createUser(_: any, { input }) {
        try {
            return await this.usersService.create(input);
        } catch (error) {
            throw error;
        }
    }

    @Mutation('updateUser')
    @Roles('isSuperUser')
    async updateUser(_: any, { id, input }) {
        try {
            return await this.usersService.update(id, input);
        } catch (error) {
            throw error;
        }
    }

    @Mutation('deleteUser')
    @Roles('isSuperUser')
    async deleteUser(_: any, { id, input }) {
        try {
            return await this.usersService.delete(id);
        } catch (error) {
            throw error;
        }
    }

    @Mutation('uploadAvatar')
    async uploadAvatar(_: any, { file }) {
        const { stream, filename, mimetype, encoding } = await file;

        const uploadDir = `${process.cwd()}/src/storage`;
        const id = shortid.generate();
        const path = `${uploadDir}/${id}-${filename}`;
        return new Promise((resolve, reject) =>
            stream
                .on('error', error => {
                    if (stream.truncated)
                        // Delete the truncated file
                        fs.unlinkSync(path);
                    reject(error);
                })
                .pipe(fs.createWriteStream(path))
                .on('error', error => reject(error))
                .on('finish', () => resolve({ id, path }))
        );
    }
}
