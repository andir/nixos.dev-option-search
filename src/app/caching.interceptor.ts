import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpInterceptor,
  HttpEvent,
  HttpHeaders,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { of, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';

@Injectable()
export class CachingInterceptor implements HttpInterceptor {

  constructor(private cache: CacheService) {
  }

  isCacheable(request: HttpRequest<any>): boolean {
    return request.method === "GET";
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isCacheable(request)) {
      return next.handle(request);
    }
    const cachedResponse = this.cache.get(request.urlWithParams);
    return cachedResponse ? of(cachedResponse) : this.sendRequest(request, next);
  }

  sendRequest(
  req: HttpRequest<any>,
  next: HttpHandler): Observable<HttpEvent<any>> {

  // No headers allowed in npm search request
  const noHeaderReq = req.clone({ headers: new HttpHeaders() });

  return next.handle(noHeaderReq).pipe(
    tap(event => {
      // There may be other events besides the response.
      if (event instanceof HttpResponse || event instanceof HttpErrorResponse) {
        this.cache.put(req.urlWithParams, event); // Update the cache.
      }
    })
  );
}
}
