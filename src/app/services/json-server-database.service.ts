import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, of, catchError } from 'rxjs';
import { IDatabaseService } from './database.interface';
import { Resident, CertificateRequest, Household, SystemUser, Role } from './data.service';

/** Base URL for the JSON Server API (e.g. http://localhost:3000). Use API_BASE_URL token to override. */
export const API_BASE_URL = 'http://localhost:3000';

/**
 * Database service that uses JSON Server as a temporary REST API.
 * Use this until Firebase is integrated. Run `npm run api` to start the server.
 */
@Injectable({
  providedIn: 'root',
})
export class JsonServerDatabaseService implements IDatabaseService {
  private http = inject(HttpClient);
  private baseUrl = API_BASE_URL;

  /** Allow overriding base URL (e.g. in tests or different ports). */
  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
  }

  private url(resource: string, id?: string): string {
    const path = id ? `${resource}/${id}` : resource;
    return `${this.baseUrl}/${path}`;
  }

  // Residents
  getResidents(): Observable<Resident[]> {
    return this.http.get<Resident[]>(this.url('residents'));
  }

  getResidentById(id: string): Observable<Resident | null> {
    return this.http.get<Resident>(this.url('residents', id)).pipe(
      map((r) => r ?? null),
      catchError(() => of(null))
    );
  }

  getResidentByResidentId(residentId: string): Observable<Resident | null> {
    return this.http
      .get<Resident[]>(this.url('residents'), { params: { residentId } })
      .pipe(map((list) => (list && list[0]) || null));
  }

  addResident(resident: Resident): Observable<Resident> {
    return this.http.post<Resident>(this.url('residents'), resident);
  }

  updateResident(id: string, updates: Partial<Resident>): Observable<Resident> {
    return this.http.patch<Resident>(this.url('residents', id), updates);
  }

  deleteResident(id: string): Observable<void> {
    return this.http.delete<void>(this.url('residents', id));
  }

  // Requests
  getRequests(): Observable<CertificateRequest[]> {
    return this.http.get<CertificateRequest[]>(this.url('requests'));
  }

  getRequestById(id: string): Observable<CertificateRequest | null> {
    return this.http.get<CertificateRequest>(this.url('requests', id)).pipe(
      map((r) => r ?? null),
      catchError(() => of(null))
    );
  }

  addRequest(request: CertificateRequest): Observable<CertificateRequest> {
    return this.http.post<CertificateRequest>(this.url('requests'), request);
  }

  updateRequest(
    id: string,
    updates: Partial<CertificateRequest>
  ): Observable<CertificateRequest> {
    return this.http.patch<CertificateRequest>(
      this.url('requests', id),
      updates
    );
  }

  deleteRequest(id: string): Observable<void> {
    return this.http.delete<void>(this.url('requests', id));
  }

  // Households
  getHouseholds(): Observable<Household[]> {
    return this.http.get<Household[]>(this.url('households'));
  }

  getHouseholdById(id: string): Observable<Household | null> {
    return this.http.get<Household>(this.url('households', id)).pipe(
      map((h) => h ?? null),
      catchError(() => of(null))
    );
  }

  getHouseholdByResidentId(residentId: string): Observable<Household | null> {
    return this.getHouseholds().pipe(
      map(
        (list) =>
          list.find((h) =>
            h.members?.some((m) => m.residentId === residentId)
          ) ?? null
      )
    );
  }

  getHouseholdByHeadId(headId: string): Observable<Household | null> {
    return this.http
      .get<Household[]>(this.url('households'), { params: { headId } })
      .pipe(map((list) => (list && list[0]) || null));
  }

  addHousehold(household: Household): Observable<Household> {
    return this.http.post<Household>(this.url('households'), household);
  }

  updateHousehold(
    id: string,
    updates: Partial<Household>
  ): Observable<Household> {
    return this.http.patch<Household>(
      this.url('households', id),
      updates
    );
  }

  deleteHousehold(id: string): Observable<void> {
    return this.http.delete<void>(this.url('households', id));
  }

  // Users
  getUsers(): Observable<SystemUser[]> {
    return this.http.get<SystemUser[]>(this.url('users'));
  }

  getUserById(id: string): Observable<SystemUser | null> {
    return this.http.get<SystemUser>(this.url('users', id)).pipe(
      map((u) => u ?? null),
      catchError(() => of(null))
    );
  }

  addUser(user: SystemUser): Observable<SystemUser> {
    return this.http.post<SystemUser>(this.url('users'), user);
  }

  updateUser(
    id: string,
    updates: Partial<SystemUser>
  ): Observable<SystemUser> {
    return this.http.patch<SystemUser>(this.url('users', id), updates);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(this.url('users', id));
  }

  // Roles
  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.url('roles'));
  }

  getRoleById(id: string): Observable<Role | null> {
    return this.http.get<Role>(this.url('roles', id)).pipe(
      map((r) => r ?? null),
      catchError(() => of(null))
    );
  }

  addRole(role: Role): Observable<Role> {
    return this.http.post<Role>(this.url('roles'), role);
  }

  updateRole(id: string, updates: Partial<Role>): Observable<Role> {
    return this.http.patch<Role>(this.url('roles', id), updates);
  }

  deleteRole(id: string): Observable<void> {
    return this.http.delete<void>(this.url('roles', id));
  }

  // Stats (computed from residents and households)
  getStats(): Observable<{
    totalResidents: number;
    totalHouseholds: number;
    seniorCitizens: number;
  }> {
    return this.getResidents().pipe(
      switchMap((residents: Resident[]) =>
        this.getHouseholds().pipe(
          map((households: Household[]) => {
            const seniorCitizens = residents.filter((r: Resident) => r.age >= 60).length;
            return {
              totalResidents: residents.length,
              totalHouseholds: households.length,
              seniorCitizens: seniorCitizens || 0,
            };
          })
        )
      )
    );
  }
}
