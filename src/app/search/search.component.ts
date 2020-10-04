import { Component, OnInit, Input } from '@angular/core';
import { Observable, of, forkJoin, merge } from 'rxjs';
import { IndexService } from '../index.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { tap, map } from 'rxjs/operators';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  @Input() indexFile: string;
  index: lunr.Index;

  entries: Map<string, any>;

  results: any[];
  public form: FormGroup;

  constructor(private indexService: IndexService, private formBuilder: FormBuilder) {
    this.form = this.formBuilder.group({
      searchText: [''],
    });

    this.entries = new Map();
  }

  ngOnInit(): void {
    this.indexService.get(this.indexFile).subscribe(index => this.index = index);
    this.results = [];
    this.form.controls.searchText.valueChanges.subscribe((value) => this.onValueChange(value));
  }

  onValueChange(value: string): void {
    if (this.index && value.length >= 3) {
      // FIXME: do pagination here and not just harcoded limit of 30
      const results = this.index.search(value.split('.').join(' '))
        .splice(0, 30).map(result => result);

      const futures = results
        // translate to the cache key
        .map(r => this.transformPath(r.ref))
        // deduplicate
        .filter((item, i, ar) => ar.indexOf(item) === i)
        // and finally emit the download request
        .map(path => this.load(path));

      if (futures.length > 0) {

        forkJoin(...futures).subscribe(event => {
          this.results = results.map(r => {
            const o = {
              "path": r.ref,
              "description": this.entries[r.ref].description,
            };
            return o;
          });
        })
      } else {
        this.results = results.map(r => `${r.ref} - ${this.entries[r.ref].description}`);
      }

    }
  }

  transformPath(value: string): string {
    let parts = value.split('.');
    let beginning = parts.splice(0, 2);
    return beginning.join('_');
  }


  load(entry: string): Observable<string> {

    if (this.entries[entry]) {
      return of(JSON.stringify(this.entries[entry]));
    }

    const index = this.transformPath(entry);
    return this.indexService.fetch(`assets/options-nixos-20.09-${index}.json`).pipe(map(response => {
      Object.entries(response).forEach(entry => {
        this.entries[entry[0]] = entry[1];
      });

      return JSON.stringify(this.entries[entry]);
    }));
  }
}
