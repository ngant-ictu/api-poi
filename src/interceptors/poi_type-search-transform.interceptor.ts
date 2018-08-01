import { Injectable, NestInterceptor, ExecutionContext } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import * as moment from "moment";
import { plainToClass } from "class-transformer";
import { PoiType } from "../entities/poi_type.entity";

export interface Response<T> {
    data: T;
}

@Injectable()
export class PoiTypeSearchTransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
    intercept(context: ExecutionContext, call$: Observable<T>): Observable<any> {
        return call$.pipe(tap(async data => {}));
    }

    private _transform(item) {
        return plainToClass(PoiType, {
            id: item.pt_id,
            name: item.pt_name,
            similar: item.pt_similiar,
            dateCreated: {
                readable: moment.unix(item.pt_date_created).format("MMM Do YYYY"),
                timestamp: item.pt_date_created
            }
        });
    }
}
