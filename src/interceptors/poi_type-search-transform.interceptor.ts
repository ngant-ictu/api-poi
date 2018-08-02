import { Injectable, NestInterceptor, ExecutionContext } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import * as moment from "moment";

@Injectable()
export class PoiTypeSearchTransformInterceptor<T> implements NestInterceptor {
    intercept(context: ExecutionContext, call$: Observable<T>) {
        return call$.pipe(map(async data => {
            let output = [];

            if (data[0].hits.total > 0) {
                await Promise.all(
                    data[0].hits.hits.map(item => {
                        output.push(this._transform(item._source));
                    })
                );
            }

            return output;
        }));
    }

    private _transform(item) {
        return { id: item.pt_id, name: item.pt_name, similar: item.pt_similar, dateCreated: { readable: moment
                    .unix(item.pt_date_created)
                    .format("MMM Do YYYY"), timestamp: item.pt_date_created } };
    }
}
