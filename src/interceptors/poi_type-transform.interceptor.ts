import { Injectable, NestInterceptor, ExecutionContext } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import * as moment from "moment";

export interface Response<T> {
    data: T;
}

@Injectable()
export class PoiTypeTransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
    intercept(context: ExecutionContext, call$: Observable<T>): Observable<any> {
        return call$.pipe(
            tap(async data => {
                if (typeof data.items !== "undefined") {
                    data.items.map(poiType => this._transform(poiType));
                } else {
                    data = this._transform(data);
                }

                return data;
            })
        );
    }

    private _transform(poiType) {
        if (poiType.similar !== null) {
            poiType.similar = poiType.similar.split(",");
        }

        poiType.dateCreated = {
            readable: moment.unix(poiType.dateCreated).format("MMM Do YYYY"),
            timestamp: poiType.dateCreated
        };
    }
}
