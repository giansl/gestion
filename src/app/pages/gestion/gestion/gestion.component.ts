import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {merge, Observable, of as observableOf} from 'rxjs';
import {catchError, map, startWith, switchMap} from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-gestion',
  templateUrl: './gestion.component.html',
  styleUrls: ['./gestion.component.css']
})
export class GestionComponent implements AfterViewInit, OnInit {

  userConnected!: string;
  displayedColumns: string[] = ['created', 'state', 'number', 'title', 'state1', 'state2', 'state3', 'state4', 'state5'];
  phoneColumns: string[] = ['created', 'state', 'number', 'title', 'state1', 'state2', 'state3'];
  exampleDatabase!: ExampleHttpDatabase | null;
  filteredAndPagedIssues!: Observable<GithubIssue[]>;

  resultsLength = 0;
  isLoadingResults = true;
  isRateLimitReached = false;

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort: MatSort = new MatSort;

  constructor(private _httpClient: HttpClient, private route: ActivatedRoute) {}
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.userConnected = params.usuario + ' - ' +params.NombreGestor;
        console.log(params);
    });
  }

  ngAfterViewInit() {
    
    this.exampleDatabase = new ExampleHttpDatabase(this._httpClient);

    this.filteredAndPagedIssues = merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;
          return this.exampleDatabase!.getRepoIssues(
            this.sort.active, this.sort.direction, this.paginator.pageIndex);
        }),
        map(data => {
          // Flip flag to show that loading has finished.
          this.isLoadingResults = false;
          this.isRateLimitReached = false;
          this.resultsLength = data.total_count;

          return data.items;
        }),
        catchError(() => {
          this.isLoadingResults = false;
          // Catch if the GitHub API has reached its rate limit. Return empty data.
          this.isRateLimitReached = true;
          return observableOf([]);
        })
      );
  }

  resetPaging(): void {
    this.paginator.pageIndex = 0;
  }

  
}

export interface GithubApi {
  items: GithubIssue[];
  total_count: number;
}

export interface GithubIssue {
  created_at: string;
  number: string;
  state: string;
  title: string;
}

/** An example database that the data source uses to retrieve data for the table. */
export class ExampleHttpDatabase {
  constructor(private _httpClient: HttpClient) {}

  getRepoIssues(sort: string, order: string, page: number): Observable<GithubApi> {
    const href = 'https://api.github.com/search/issues';
    const requestUrl =
        `${href}?q=repo:angular/components&sort=${sort}&order=${order}&page=${page + 1}`;

    return this._httpClient.get<GithubApi>(requestUrl);
  }
}
