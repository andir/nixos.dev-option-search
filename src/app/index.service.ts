import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

import { Index } from 'lunr';

@Injectable({
  providedIn: 'root'
})
export class IndexService {

  constructor(private http: HttpClient) { }

  // indexFile example: index/packages-nixos-20.03.json
  public get(indexFile: string): Observable<Index> {
    return this.http.get(indexFile).pipe(
      tap(response => {
        console.log(response);
      }),
      map(response => Index.load(response))
    );
  }

  public fetch(file: string): Observable<any> {
    return this.http.get(file);
  }
}
