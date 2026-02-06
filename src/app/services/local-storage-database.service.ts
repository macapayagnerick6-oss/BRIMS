import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { IDatabaseService } from './database.interface';
import { Resident, CertificateRequest, Household, SystemUser, Role } from './data.service';

const STORAGE_KEYS = {
  RESIDENTS: 'brims_residents',
  REQUESTS: 'brims_requests',
  HOUSEHOLDS: 'brims_households',
  USERS: 'brims_users',
  ROLES: 'brims_roles',
};

@Injectable({
  providedIn: 'root'
})
export class LocalStorageDatabaseService implements IDatabaseService {
  
  // Initialize with default data if storage is empty
  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    // Only initialize if storage is empty
    if (!localStorage.getItem(STORAGE_KEYS.RESIDENTS)) {
      const defaultResidents: Resident[] = [
        { id: '1', residentId: 'BRGY-1001', name: 'Juan Dela Cruz', age: 44, gender: 'Male', purok: 'Purok 2', birthdate: 'January 15, 1980', placeOfBirth: 'Villanueva, Misamis Oriental', birthCertificateNumber: 'BC-1980-001234', bloodType: 'O+', civilStatus: 'Single', nationality: 'Filipino', contact: '0917 123 4557', address: 'Purok 2, Barangay Name, City Name' },
        { id: '2', residentId: 'BRGY-1002', name: 'Maria Santos', age: 38, gender: 'Female', purok: 'Purok 1', placeOfBirth: 'Cagayan de Oro City', birthCertificateNumber: 'BC-1986-005678', bloodType: 'A+' },
        { id: '3', residentId: 'BRGY-1003', name: 'Pedro Reyes', age: 65, gender: 'Male', purok: 'Purok 3', placeOfBirth: 'Villanueva, Misamis Oriental', birthCertificateNumber: 'BC-1959-009012', bloodType: 'B+' },
        { id: '4', residentId: 'BRGY-1004', name: 'Ana Garcia', age: 29, gender: 'Female', purok: 'Purok 2', placeOfBirth: 'Villanueva, Misamis Oriental', birthCertificateNumber: 'BC-1995-003456', bloodType: 'AB+' },
        { id: '5', residentId: 'BRGY-1005', name: 'Roberto Lopez', age: 72, gender: 'Male', purok: 'Purok 1', placeOfBirth: 'Manila', birthCertificateNumber: 'BC-1952-007890', bloodType: 'O-' },
      ];
      this.saveToStorage(STORAGE_KEYS.RESIDENTS, defaultResidents);
    }

    if (!localStorage.getItem(STORAGE_KEYS.REQUESTS)) {
      const defaultRequests: CertificateRequest[] = [
        { id: '1', type: 'Request Clearance', purpose: 'For employment', status: 'For Review', date: 'Aug 15, 2034' },
        { id: '2', type: 'Barangay Clearance', purpose: 'For employment purposes', status: 'Pending', date: 'Apr 13, 2034' },
        { id: '3', type: 'Certificate of Residency', purpose: 'For school requirements', status: 'Approved', date: 'Mar 24, 2034' },
      ];
      this.saveToStorage(STORAGE_KEYS.REQUESTS, defaultRequests);
    }

    if (!localStorage.getItem(STORAGE_KEYS.HOUSEHOLDS)) {
      const defaultHouseholds: Household[] = [
        {
          id: 'h1',
          householdId: 'HH-001',
          headId: '1',
          address: 'Purok 2, Barangay Name, City Name',
          purok: 'Purok 2',
          // Sample coordinates near Villanueva, Misamis Oriental (update to your barangay center as needed)
          latitude: 8.574,
          longitude: 124.776,
          status: 'Active',
          riskLevel: 'flood_prone',
          barangayZone: 'Zone 1',
          members: [
            { residentId: 'BRGY-1001', name: 'Juan Dela Cruz', age: 44, gender: 'Male', relationship: 'Head', birthdate: 'January 15, 1980', civilStatus: 'Single' },
            { residentId: 'BRGY-1004', name: 'Ana Garcia', age: 29, gender: 'Female', relationship: 'Sister', birthdate: 'March 20, 1995', civilStatus: 'Single' },
          ],
        },
        {
          id: 'h2',
          householdId: 'HH-002',
          headId: '2',
          address: 'Purok 1, Barangay Name, City Name',
          purok: 'Purok 1',
          latitude: 8.575,
          longitude: 124.774,
          status: 'Active',
          riskLevel: 'fire_risk',
          barangayZone: 'Zone 1',
          members: [
            { residentId: 'BRGY-1002', name: 'Maria Santos', age: 38, gender: 'Female', relationship: 'Head', birthdate: 'June 10, 1986', civilStatus: 'Married' },
            { residentId: 'BRGY-1005', name: 'Roberto Lopez', age: 72, gender: 'Male', relationship: 'Father', birthdate: 'May 5, 1952', civilStatus: 'Widowed' },
          ],
        },
        {
          id: 'h3',
          householdId: 'HH-003',
          headId: '3',
          address: 'Purok 3, Barangay Name, City Name',
          purok: 'Purok 3',
          latitude: 8.573,
          longitude: 124.778,
          status: 'Active',
          riskLevel: 'normal',
          barangayZone: 'Zone 2',
          members: [
            { residentId: 'BRGY-1003', name: 'Pedro Reyes', age: 65, gender: 'Male', relationship: 'Head', birthdate: 'August 22, 1959', civilStatus: 'Married' },
          ],
        },
      ];
      this.saveToStorage(STORAGE_KEYS.HOUSEHOLDS, defaultHouseholds);
    }

    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      const defaultUsers: SystemUser[] = [
        { id: '1', name: 'Staff User', email: 'staff@barangay.gov', role: 'Staff', status: 'Active', lastLogin: 'Jan 29, 2026', createdAt: 'Jan 1, 2025' },
        { id: '2', name: 'Juan Dela Cruz', email: 'resident@email.com', role: 'Resident', status: 'Active', lastLogin: 'Jan 28, 2026', createdAt: 'Jan 15, 2025' },
        { id: '3', name: 'Maria Santos', email: 'maria.santos@email.com', role: 'Resident', status: 'Active', lastLogin: 'Jan 27, 2026', createdAt: 'Feb 3, 2025' },
        { id: '4', name: 'Admin User', email: 'admin@barangay.gov', role: 'Admin', status: 'Active', lastLogin: 'Jan 29, 2026', createdAt: 'Dec 1, 2024' },
        { id: '5', name: 'Pedro Reyes', email: 'pedro.reyes@email.com', role: 'Resident', status: 'Inactive', lastLogin: 'Dec 15, 2025', createdAt: 'Mar 10, 2025' },
        { id: '6', name: 'Ana Garcia', email: 'ana.garcia@email.com', role: 'Resident', status: 'Active', lastLogin: 'Jan 26, 2026', createdAt: 'Apr 5, 2025' },
        { id: '7', name: 'Roberto Lopez', email: 'roberto.lopez@email.com', role: 'Resident', status: 'Active', lastLogin: 'Jan 25, 2026', createdAt: 'May 12, 2025' },
      ];
      this.saveToStorage(STORAGE_KEYS.USERS, defaultUsers);
    }

    if (!localStorage.getItem(STORAGE_KEYS.ROLES)) {
      const defaultRoles: Role[] = [
        { 
          id: '1', 
          name: 'Admin', 
          description: 'Full system access with all permissions', 
          permissions: ['Manage Users', 'Manage Roles', 'View All Reports', 'Manage Residents', 'Manage Households', 'Approve Requests', 'System Settings'],
          userCount: 1
        },
        { 
          id: '2', 
          name: 'Staff', 
          description: 'Barangay staff with management capabilities', 
          permissions: ['View Reports', 'Manage Residents', 'Manage Households', 'Process Requests', 'View Users'],
          userCount: 1
        },
        { 
          id: '3', 
          name: 'Resident', 
          description: 'Regular resident users with limited access', 
          permissions: ['View Own Profile', 'Request Certificates', 'View Own Requests', 'Update Profile'],
          userCount: 5
        },
      ];
      this.saveToStorage(STORAGE_KEYS.ROLES, defaultRoles);
    }
  }

  private getFromStorage<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return [];
    }
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to localStorage (${key}):`, error);
      throw error;
    }
  }

  // Residents
  getResidents(): Observable<Resident[]> {
    return of(this.getFromStorage<Resident>(STORAGE_KEYS.RESIDENTS));
  }

  getResidentById(id: string): Observable<Resident | null> {
    const residents = this.getFromStorage<Resident>(STORAGE_KEYS.RESIDENTS);
    const resident = residents.find(r => r.id === id);
    return of(resident || null);
  }

  getResidentByResidentId(residentId: string): Observable<Resident | null> {
    const residents = this.getFromStorage<Resident>(STORAGE_KEYS.RESIDENTS);
    const resident = residents.find(r => r.residentId === residentId);
    return of(resident || null);
  }

  addResident(resident: Resident): Observable<Resident> {
    const residents = this.getFromStorage<Resident>(STORAGE_KEYS.RESIDENTS);
    residents.push(resident);
    this.saveToStorage(STORAGE_KEYS.RESIDENTS, residents);
    return of(resident);
  }

  updateResident(id: string, updates: Partial<Resident>): Observable<Resident> {
    const residents = this.getFromStorage<Resident>(STORAGE_KEYS.RESIDENTS);
    const index = residents.findIndex(r => r.id === id);
    if (index === -1) {
      return throwError(() => new Error(`Resident with id ${id} not found`));
    }
    residents[index] = { ...residents[index], ...updates };
    this.saveToStorage(STORAGE_KEYS.RESIDENTS, residents);
    return of(residents[index]);
  }

  deleteResident(id: string): Observable<void> {
    const residents = this.getFromStorage<Resident>(STORAGE_KEYS.RESIDENTS);
    const filtered = residents.filter(r => r.id !== id);
    this.saveToStorage(STORAGE_KEYS.RESIDENTS, filtered);
    return of(void 0);
  }

  // Requests
  getRequests(): Observable<CertificateRequest[]> {
    return of(this.getFromStorage<CertificateRequest>(STORAGE_KEYS.REQUESTS));
  }

  getRequestById(id: string): Observable<CertificateRequest | null> {
    const requests = this.getFromStorage<CertificateRequest>(STORAGE_KEYS.REQUESTS);
    const request = requests.find(r => r.id === id);
    return of(request || null);
  }

  addRequest(request: CertificateRequest): Observable<CertificateRequest> {
    const requests = this.getFromStorage<CertificateRequest>(STORAGE_KEYS.REQUESTS);
    requests.push(request);
    this.saveToStorage(STORAGE_KEYS.REQUESTS, requests);
    return of(request);
  }

  updateRequest(id: string, updates: Partial<CertificateRequest>): Observable<CertificateRequest> {
    const requests = this.getFromStorage<CertificateRequest>(STORAGE_KEYS.REQUESTS);
    const index = requests.findIndex(r => r.id === id);
    if (index === -1) {
      return throwError(() => new Error(`Request with id ${id} not found`));
    }
    requests[index] = { ...requests[index], ...updates };
    this.saveToStorage(STORAGE_KEYS.REQUESTS, requests);
    return of(requests[index]);
  }

  deleteRequest(id: string): Observable<void> {
    const requests = this.getFromStorage<CertificateRequest>(STORAGE_KEYS.REQUESTS);
    const filtered = requests.filter(r => r.id !== id);
    this.saveToStorage(STORAGE_KEYS.REQUESTS, filtered);
    return of(void 0);
  }

  // Households
  getHouseholds(): Observable<Household[]> {
    return of(this.getFromStorage<Household>(STORAGE_KEYS.HOUSEHOLDS));
  }

  getHouseholdById(id: string): Observable<Household | null> {
    const households = this.getFromStorage<Household>(STORAGE_KEYS.HOUSEHOLDS);
    const household = households.find(h => h.id === id);
    return of(household || null);
  }

  getHouseholdByResidentId(residentId: string): Observable<Household | null> {
    const households = this.getFromStorage<Household>(STORAGE_KEYS.HOUSEHOLDS);
    const household = households.find(h => 
      h.members.some(m => m.residentId === residentId)
    );
    return of(household || null);
  }

  getHouseholdByHeadId(headId: string): Observable<Household | null> {
    const households = this.getFromStorage<Household>(STORAGE_KEYS.HOUSEHOLDS);
    const household = households.find(h => h.headId === headId);
    return of(household || null);
  }

  addHousehold(household: Household): Observable<Household> {
    const households = this.getFromStorage<Household>(STORAGE_KEYS.HOUSEHOLDS);
    households.push(household);
    this.saveToStorage(STORAGE_KEYS.HOUSEHOLDS, households);
    return of(household);
  }

  updateHousehold(id: string, updates: Partial<Household>): Observable<Household> {
    const households = this.getFromStorage<Household>(STORAGE_KEYS.HOUSEHOLDS);
    const index = households.findIndex(h => h.id === id);
    if (index === -1) {
      return throwError(() => new Error(`Household with id ${id} not found`));
    }
    households[index] = { ...households[index], ...updates };
    this.saveToStorage(STORAGE_KEYS.HOUSEHOLDS, households);
    return of(households[index]);
  }

  deleteHousehold(id: string): Observable<void> {
    const households = this.getFromStorage<Household>(STORAGE_KEYS.HOUSEHOLDS);
    const filtered = households.filter(h => h.id !== id);
    this.saveToStorage(STORAGE_KEYS.HOUSEHOLDS, filtered);
    return of(void 0);
  }

  // Users
  getUsers(): Observable<SystemUser[]> {
    return of(this.getFromStorage<SystemUser>(STORAGE_KEYS.USERS));
  }

  getUserById(id: string): Observable<SystemUser | null> {
    const users = this.getFromStorage<SystemUser>(STORAGE_KEYS.USERS);
    const user = users.find(u => u.id === id);
    return of(user || null);
  }

  addUser(user: SystemUser): Observable<SystemUser> {
    const users = this.getFromStorage<SystemUser>(STORAGE_KEYS.USERS);
    users.push(user);
    this.saveToStorage(STORAGE_KEYS.USERS, users);
    return of(user);
  }

  updateUser(id: string, updates: Partial<SystemUser>): Observable<SystemUser> {
    const users = this.getFromStorage<SystemUser>(STORAGE_KEYS.USERS);
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
      return throwError(() => new Error(`User with id ${id} not found`));
    }
    users[index] = { ...users[index], ...updates };
    this.saveToStorage(STORAGE_KEYS.USERS, users);
    return of(users[index]);
  }

  deleteUser(id: string): Observable<void> {
    const users = this.getFromStorage<SystemUser>(STORAGE_KEYS.USERS);
    const filtered = users.filter(u => u.id !== id);
    this.saveToStorage(STORAGE_KEYS.USERS, filtered);
    return of(void 0);
  }

  // Roles
  getRoles(): Observable<Role[]> {
    return of(this.getFromStorage<Role>(STORAGE_KEYS.ROLES));
  }

  getRoleById(id: string): Observable<Role | null> {
    const roles = this.getFromStorage<Role>(STORAGE_KEYS.ROLES);
    const role = roles.find(r => r.id === id);
    return of(role || null);
  }

  addRole(role: Role): Observable<Role> {
    const roles = this.getFromStorage<Role>(STORAGE_KEYS.ROLES);
    roles.push(role);
    this.saveToStorage(STORAGE_KEYS.ROLES, roles);
    return of(role);
  }

  updateRole(id: string, updates: Partial<Role>): Observable<Role> {
    const roles = this.getFromStorage<Role>(STORAGE_KEYS.ROLES);
    const index = roles.findIndex(r => r.id === id);
    if (index === -1) {
      return throwError(() => new Error(`Role with id ${id} not found`));
    }
    roles[index] = { ...roles[index], ...updates };
    this.saveToStorage(STORAGE_KEYS.ROLES, roles);
    return of(roles[index]);
  }

  deleteRole(id: string): Observable<void> {
    const roles = this.getFromStorage<Role>(STORAGE_KEYS.ROLES);
    const filtered = roles.filter(r => r.id !== id);
    this.saveToStorage(STORAGE_KEYS.ROLES, filtered);
    return of(void 0);
  }

  // Stats
  getStats(): Observable<{ totalResidents: number; totalHouseholds: number; seniorCitizens: number }> {
    const residents = this.getFromStorage<Resident>(STORAGE_KEYS.RESIDENTS);
    const households = this.getFromStorage<Household>(STORAGE_KEYS.HOUSEHOLDS);
    const seniorCitizens = residents.filter(r => r.age >= 60).length;
    
    return of({
      totalResidents: residents.length,
      totalHouseholds: households.length,
      seniorCitizens: seniorCitizens || 245
    });
  }
}
