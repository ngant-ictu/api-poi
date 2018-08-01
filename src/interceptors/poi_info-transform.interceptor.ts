import { Injectable, NestInterceptor, ExecutionContext } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import * as moment from "moment";

export interface Response<T> {
    data: T;
}

@Injectable()
export class PoiInfoTransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
    intercept(context: ExecutionContext, call$: Observable<T>): Observable<any> {
        return call$.pipe(
            tap(data => {
                if (typeof data.items !== "undefined") {
                    data.items.map(async poiInfo => await this._transform(poiInfo));
                } else {
                    data = this._transform(data);
                }

                return data;
            })
        );
    }

    private async _transform(poiInfo) {
        if (poiInfo.similar !== null) {
            poiInfo.similar = poiInfo.similar.split(",");
        }

        poiInfo.dateCreated = {
            readable: moment.unix(poiInfo.dateCreated).format("MMM Do YYYY"),
            timestamp: poiInfo.dateCreated
        };
    }
}
