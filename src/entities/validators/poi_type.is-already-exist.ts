import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments
} from "class-validator";
import { PoiType } from "../poi_type.entity";

@ValidatorConstraint({ async: true })
export class IsTypeAlreadyExistConstraint implements ValidatorConstraintInterface {
    validate(name: string, args: ValidationArguments) {
        return PoiType.findOne({
            name: `CONVERT('${name}', BINARY)`
        }).then(type => {
            if (type) return false;
            return true;
        });
    }
}

export function IsTypeAlreadyExist(validationOptions?: ValidationOptions) {
    return function(object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsTypeAlreadyExistConstraint
        });
    };
}
