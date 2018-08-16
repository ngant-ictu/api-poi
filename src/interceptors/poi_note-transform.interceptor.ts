import { Injectable, NestInterceptor, ExecutionContext } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import * as moment from "moment";

export interface Response<T> {
    data: T;
}

@Injectable()
export class PoiNoteTransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
    intercept(context: ExecutionContext, call$: Observable<T>): Observable<any> {
        return call$.pipe(
            tap(data => {
                if (typeof data !== "undefined" && data.length > 0) {
                    data.map(async poiNote => await this._transform(poiNote));
                } else {
                    data = this._transform(data);
                }

                return data;
            })
        );
    }

    private async _transform(poiNote) {
        poiNote.dateCreated = {
            readable: moment.unix(poiNote.dateCreated).format("MMM Do YYYY hh:mm"),
            timestamp: poiNote.dateCreated
        };
    }
}
