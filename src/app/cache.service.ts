import { Injectable } from '@angular/core';
import { HttpEvent } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CacheService {

  entries: Map<string, HttpEvent<any>>

  constructor() {
    this.entries = new Map();
  }

  public put(key: string, value: HttpEvent<any>): void {
    this.entries[key] = value;
  }

  public get(key: string): HttpEvent<any> {
    const entry = this.entries[key];
    return entry ? entry : null;
  }
}
