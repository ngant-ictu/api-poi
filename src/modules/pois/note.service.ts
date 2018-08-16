import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { PoiNote } from "../../entities/poi_note.entity";
import { validate } from "class-validator";

@Injectable()
export class PoiNoteService {
    constructor(
        @InjectRepository(PoiNote) private readonly noteRepository: Repository<PoiNote>
    ) {}

    async findAll(piid: number) {
        try {
            return this.noteRepository.find({
                where: { piid: piid },
                order: {
                    dateCreated: 'DESC'
                }
            });
        } catch (error) {
            throw error;
        }
    }

    async create(formData: any) {
        try {
            const myNote = this.noteRepository.create(formData);

            const errors = await validate(myNote, { validationError: { target: false } });

            if (errors.length === 0) {
                return await this.noteRepository.save(myNote);
            }
        } catch (error) {
            console.dir(error)
            throw error;
        }
    }

    async delete(id: number) {
        try {
            const myNote = await this.noteRepository.findOneOrFail(id);

            return await myNote.remove();
        } catch (error) {
            throw error;
        }
    }
}
