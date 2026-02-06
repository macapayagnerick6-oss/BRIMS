import { Observable } from 'rxjs';
import { Resident, CertificateRequest, Household, SystemUser, Role } from './data.service';

/**
 * Database abstraction interface
 * This allows easy swapping between localStorage and Firebase implementations
 */
export interface IDatabaseService {
  // Residents
  getResidents(): Observable<Resident[]>;
  getResidentById(id: string): Observable<Resident | null>;
  getResidentByResidentId(residentId: string): Observable<Resident | null>;
  addResident(resident: Resident): Observable<Resident>;
  updateResident(id: string, updates: Partial<Resident>): Observable<Resident>;
  deleteResident(id: string): Observable<void>;

  // Requests
  getRequests(): Observable<CertificateRequest[]>;
  getRequestById(id: string): Observable<CertificateRequest | null>;
  addRequest(request: CertificateRequest): Observable<CertificateRequest>;
  updateRequest(id: string, updates: Partial<CertificateRequest>): Observable<CertificateRequest>;
  deleteRequest(id: string): Observable<void>;

  // Households
  getHouseholds(): Observable<Household[]>;
  getHouseholdById(id: string): Observable<Household | null>;
  getHouseholdByResidentId(residentId: string): Observable<Household | null>;
  getHouseholdByHeadId(headId: string): Observable<Household | null>;
  addHousehold(household: Household): Observable<Household>;
  updateHousehold(id: string, updates: Partial<Household>): Observable<Household>;
  deleteHousehold(id: string): Observable<void>;

  // Users
  getUsers(): Observable<SystemUser[]>;
  getUserById(id: string): Observable<SystemUser | null>;
  addUser(user: SystemUser): Observable<SystemUser>;
  updateUser(id: string, updates: Partial<SystemUser>): Observable<SystemUser>;
  deleteUser(id: string): Observable<void>;

  // Roles
  getRoles(): Observable<Role[]>;
  getRoleById(id: string): Observable<Role | null>;
  addRole(role: Role): Observable<Role>;
  updateRole(id: string, updates: Partial<Role>): Observable<Role>;
  deleteRole(id: string): Observable<void>;

  // Stats
  getStats(): Observable<{ totalResidents: number; totalHouseholds: number; seniorCitizens: number }>;
}
