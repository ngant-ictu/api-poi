import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments
} from 'class-validator';
import { PoiInfo } from '../poi_info.entity';

@ValidatorConstraint({ async: true })
export class IsPoiAlreadyExistConstraint implements ValidatorConstraintInterface {
    validate(slug: string, args: ValidationArguments) {
        return PoiInfo.findOne({
            slug: slug
        }).then(poi => {
            if (poi) return false;
            return true;
        });
    }
}

export function IsPoiAlreadyExist(validationOptions?: ValidationOptions) {
    return function(object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsPoiAlreadyExistConstraint
        });
    };
}
