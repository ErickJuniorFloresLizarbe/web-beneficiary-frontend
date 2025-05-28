import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { environment } from '../../environments/environments';
import { AuthService } from '../auth/services/auth.service';
import { from, Observable, Subject, switchMap } from "rxjs";
import {
  ReportDto,
  ReportWithWorkshopsDto,
  WorkshopKafkaEventDto
} from "../interfaces/report.interface";

@Injectable({
  providedIn: "root",
})

export class ReportService {
  private readonly reportUrl = `${environment.ms_report}/api/reports`;
  private readonly workshopUrl = `${environment.ms_report}/api/workshop-cache`;

  reportActualizar = new Subject<ReportWithWorkshopsDto[]>();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private withAuthHeaders(): Observable<HttpHeaders> {
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        });
        return from([headers]);
      })
    );
  }

  listReportsByFilter(
    trimester?: string,
    active?: string,
    year?: number,
    workshopDateStart?: string,
    workshopDateEnd?: string
  ): Observable<ReportWithWorkshopsDto[]> {
    return this.withAuthHeaders().pipe(
      switchMap(headers => {
        let params = new HttpParams();
        if (trimester) params = params.set('trimester', trimester);
        if (active) params = params.set('status', active);
        if (year) params = params.set('year', year.toString());
        if (workshopDateStart) params = params.set('workshopDateStart', workshopDateStart);
        if (workshopDateEnd) params = params.set('workshopDateEnd', workshopDateEnd);
        return this.http.get<ReportWithWorkshopsDto[]>(this.reportUrl, { headers, params });
      })
    );
  }

  getReportByIdWithDateFilter(reportId: number, workshopDateStart?: string, workshopDateEnd?: string): Observable<ReportWithWorkshopsDto> {
    return this.withAuthHeaders().pipe(
      switchMap(headers => {
        let params = new HttpParams();
        if (workshopDateStart) params = params.set('workshopDateStart', workshopDateStart);
        if (workshopDateEnd) params = params.set('workshopDateEnd', workshopDateEnd);
        return this.http.get<ReportWithWorkshopsDto>(`${this.reportUrl}/${reportId}/filtered`, { headers, params });
      })
    );
  }

  newReport(report: ReportWithWorkshopsDto): Observable<ReportWithWorkshopsDto> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.post<ReportWithWorkshopsDto>(this.reportUrl, report, { headers })
      )
    );
  }

  createReport(report: ReportWithWorkshopsDto): Observable<ReportWithWorkshopsDto> {
    return this.newReport(report);
  }

  updateReportById(reportId: number, report: ReportWithWorkshopsDto): Observable<ReportWithWorkshopsDto> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.put<ReportWithWorkshopsDto>(`${this.reportUrl}/${reportId}`, report, { headers })
      )
    );
  }

  updateReport(report: ReportWithWorkshopsDto): Observable<ReportWithWorkshopsDto> {
    return this.updateReportById(report.report.id, report);
  }

  disableReportById(reportId: number): Observable<void> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.delete<void>(`${this.reportUrl}/${reportId}`, { headers })
      )
    );
  }

  deleteReport(reportId: number): Observable<void> {
    return this.disableReportById(reportId);
  }

  activateReportById(reportId: number): Observable<ReportDto> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.put<ReportDto>(`${this.reportUrl}/restore/${reportId}`, {}, { headers })
      )
    );
  }

  restoreReport(reportId: number): Observable<ReportDto> {
    return this.activateReportById(reportId);
  }

  downloadReportPdf(reportId: number, workshopDateStart?: string, workshopDateEnd?: string): Observable<Blob> {
    return this.withAuthHeaders().pipe(
      switchMap(headers => {
        let params = new HttpParams();
        if (workshopDateStart) {
          params = params.set('workshopDateStart', workshopDateStart);
        }
        if (workshopDateEnd) {
          params = params.set('workshopDateEnd', workshopDateEnd);
        }
        return this.http.get(`${this.reportUrl}/${reportId}/pdf`, {
          headers,
          params,
          responseType: 'blob'
        });
      })
    );
  }

  listWorkshopCache(status?: string): Observable<WorkshopKafkaEventDto[]> {
    return this.withAuthHeaders().pipe(
      switchMap(headers => {
        let params = new HttpParams();
        if (status) {
          params = params.set('status', status);
        }

        return this.http.get<WorkshopKafkaEventDto[]>(this.workshopUrl, { headers, params });
      })
    );
  }

  getWorkshopCacheById(id: number): Observable<WorkshopKafkaEventDto> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.get<WorkshopKafkaEventDto>(`${this.workshopUrl}/${id}`, { headers })
      )
    );
  }

  checkReportExists(year: number, trimester: string): Observable<boolean> {
    return this.withAuthHeaders().pipe(
      switchMap(headers => {
        const params = new HttpParams()
          .set('year', year.toString())
          .set('trimester', trimester);
        return this.http.get<boolean>(`${this.reportUrl}/exist`, { headers, params });
      })
    );
  }

}
