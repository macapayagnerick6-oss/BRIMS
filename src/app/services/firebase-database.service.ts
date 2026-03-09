import { Injectable, inject } from '@angular/core';
import { Observable, from, of, combineLatest } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { IDatabaseService } from './database.interface';
import { Resident, CertificateRequest, Household, SystemUser, Role } from './data.service';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from '@angular/fire/firestore';

/**
 * Firebase Database Service - Firestore implementation
 *
 * Notes:
 * - Uses document IDs that match the `id` field of each entity.
 * - DataService remains the single source of truth for in-memory caches;
 *   this service is responsible only for persisting to Firestore and
 *   providing reactive streams.
 */
@Injectable({
  providedIn: 'root'
})
export class FirebaseDatabaseService implements IDatabaseService {
  private firestore = inject(Firestore);

  private collectionRef<T>(path: string) {
    return collection(this.firestore, path);
  }

  private docRef(path: string, id: string) {
    return doc(this.firestore, `${path}/${id}`);
  }

  // Residents
  getResidents(): Observable<Resident[]> {
    const ref = this.collectionRef<Resident>('residents');
    return collectionData(ref, { idField: 'id' }) as Observable<Resident[]>;
  }

  getResidentById(id: string): Observable<Resident | null> {
    const ref = this.docRef('residents', id);
    return docData(ref).pipe(
      map((data) => (data ? ({ ...(data as Resident), id }) : null)),
      catchError(() => of(null))
    );
  }

  getResidentByResidentId(residentId: string): Observable<Resident | null> {
    const ref = this.collectionRef<Resident>('residents');
    const q = query(ref, where('residentId', '==', residentId));
    return collectionData(q, { idField: 'id' }).pipe(
      map((list) => (list[0] as Resident) ?? null),
      catchError(() => of(null))
    );
  }

  addResident(resident: Resident): Observable<Resident> {
    const ref = this.docRef('residents', resident.id);
    return from(setDoc(ref, resident)).pipe(map(() => resident));
  }

  updateResident(id: string, updates: Partial<Resident>): Observable<Resident> {
    const ref = this.docRef('residents', id);
    return from(updateDoc(ref, updates as any)).pipe(
      switchMap(() => this.getResidentById(id) as Observable<Resident>)
    );
  }

  deleteResident(id: string): Observable<void> {
    const ref = this.docRef('residents', id);
    return from(deleteDoc(ref)).pipe(map(() => void 0));
  }

  // Requests
  getRequests(): Observable<CertificateRequest[]> {
    const ref = this.collectionRef<CertificateRequest>('requests');
    return collectionData(ref, { idField: 'id' }) as Observable<CertificateRequest[]>;
  }

  getRequestById(id: string): Observable<CertificateRequest | null> {
    const ref = this.docRef('requests', id);
    return docData(ref).pipe(
      map((data) => (data ? ({ ...(data as CertificateRequest), id }) : null)),
      catchError(() => of(null))
    );
  }

  addRequest(request: CertificateRequest): Observable<CertificateRequest> {
    const ref = this.docRef('requests', request.id);
    return from(setDoc(ref, request)).pipe(map(() => request));
  }

  updateRequest(id: string, updates: Partial<CertificateRequest>): Observable<CertificateRequest> {
    const ref = this.docRef('requests', id);
    return from(updateDoc(ref, updates as any)).pipe(
      switchMap(() => this.getRequestById(id) as Observable<CertificateRequest>)
    );
  }

  deleteRequest(id: string): Observable<void> {
    const ref = this.docRef('requests', id);
    return from(deleteDoc(ref)).pipe(map(() => void 0));
  }

  // Households
  getHouseholds(): Observable<Household[]> {
    const ref = this.collectionRef<Household>('households');
    return collectionData(ref, { idField: 'id' }) as Observable<Household[]>;
  }

  getHouseholdById(id: string): Observable<Household | null> {
    const ref = this.docRef('households', id);
    return docData(ref).pipe(
      map((data) => (data ? ({ ...(data as Household), id }) : null)),
      catchError(() => of(null))
    );
  }

  getHouseholdByResidentId(residentId: string): Observable<Household | null> {
    const ref = this.collectionRef<Household>('households');
    const q = query(ref, where('members', 'array-contains', { residentId }));
    // Fallback: filter client-side if array-contains of object is not desired
    return collectionData(q, { idField: 'id' }).pipe(
      map((list) => (list[0] as Household) ?? null),
      catchError(() => of(null))
    );
  }

  getHouseholdByHeadId(headId: string): Observable<Household | null> {
    const ref = this.collectionRef<Household>('households');
    const q = query(ref, where('headId', '==', headId));
    return collectionData(q, { idField: 'id' }).pipe(
      map((list) => (list[0] as Household) ?? null),
      catchError(() => of(null))
    );
  }

  addHousehold(household: Household): Observable<Household> {
    const ref = this.docRef('households', household.id);
    return from(setDoc(ref, household)).pipe(map(() => household));
  }

  updateHousehold(id: string, updates: Partial<Household>): Observable<Household> {
    const ref = this.docRef('households', id);
    return from(updateDoc(ref, updates as any)).pipe(
      switchMap(() => this.getHouseholdById(id) as Observable<Household>)
    );
  }

  deleteHousehold(id: string): Observable<void> {
    const ref = this.docRef('households', id);
    return from(deleteDoc(ref)).pipe(map(() => void 0));
  }

  // Users
  getUsers(): Observable<SystemUser[]> {
    const ref = this.collectionRef<SystemUser>('users');
    return collectionData(ref, { idField: 'id' }) as Observable<SystemUser[]>;
  }

  getUserById(id: string): Observable<SystemUser | null> {
    const ref = this.docRef('users', id);
    return docData(ref).pipe(
      map((data) => (data ? ({ ...(data as SystemUser), id }) : null)),
      catchError(() => of(null))
    );
  }

  addUser(user: SystemUser): Observable<SystemUser> {
    const ref = this.docRef('users', user.id);
    return from(setDoc(ref, user)).pipe(map(() => user));
  }

  updateUser(id: string, updates: Partial<SystemUser>): Observable<SystemUser> {
    const ref = this.docRef('users', id);
    return from(updateDoc(ref, updates as any)).pipe(
      switchMap(() => this.getUserById(id) as Observable<SystemUser>)
    );
  }

  deleteUser(id: string): Observable<void> {
    const ref = this.docRef('users', id);
    return from(deleteDoc(ref)).pipe(map(() => void 0));
  }

  // Roles
  getRoles(): Observable<Role[]> {
    const ref = this.collectionRef<Role>('roles');
    return collectionData(ref, { idField: 'id' }) as Observable<Role[]>;
  }

  getRoleById(id: string): Observable<Role | null> {
    const ref = this.docRef('roles', id);
    return docData(ref).pipe(
      map((data) => (data ? ({ ...(data as Role), id }) : null)),
      catchError(() => of(null))
    );
  }

  addRole(role: Role): Observable<Role> {
    const ref = this.docRef('roles', role.id);
    return from(setDoc(ref, role)).pipe(map(() => role));
  }

  updateRole(id: string, updates: Partial<Role>): Observable<Role> {
    const ref = this.docRef('roles', id);
    return from(updateDoc(ref, updates as any)).pipe(
      switchMap(() => this.getRoleById(id) as Observable<Role>)
    );
  }

  deleteRole(id: string): Observable<void> {
    const ref = this.docRef('roles', id);
    return from(deleteDoc(ref)).pipe(map(() => void 0));
  }

  // Stats
  getStats(): Observable<{ totalResidents: number; totalHouseholds: number; seniorCitizens: number }> {
    return combineLatest([this.getResidents(), this.getHouseholds()]).pipe(
      map(([residents, households]) => {
        const seniorCitizens = residents.filter(r => r.age >= 60).length;
        return {
          totalResidents: residents.length,
          totalHouseholds: households.length,
          seniorCitizens,
        };
      })
    );
  }
}
