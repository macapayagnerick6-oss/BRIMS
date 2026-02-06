import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { IDatabaseService } from './database.interface';
import { LocalStorageDatabaseService } from './local-storage-database.service';
import { AuditLogService } from './audit-log.service';
// To switch to Firebase in the future, uncomment the line below and change the provider:
// import { FirebaseDatabaseService } from './firebase-database.service';

export interface Resident {
  id: string;
  residentId: string;
  name: string;
  age: number;
  gender: string;
  purok: string;
  birthdate?: string;
  placeOfBirth?: string;
  birthCertificateNumber?: string;
  bloodType?: string;
  civilStatus?: string;
  nationality?: string;
  contact?: string;
  email?: string;
  password?: string;  // for resident portal login (store hashed in production)
  address?: string;
}

export interface CertificateRequest {
  id: string;
  type: string;
  purpose: string;
  status: 'Approved' | 'Pending' | 'For Review' | 'Rejected';
  date: string;
  residentId?: string;
}

export interface HouseholdMember {
  residentId: string;
  name: string;
  age: number;
  gender: string;
  relationship: string;
  birthdate?: string;
  civilStatus?: string;
}

export interface Household {
  id: string;
  householdId: string;
  headId: string;
  address: string;
  purok: string;
  /** Optional geographic coordinates for GIS mapping */
  latitude?: number | null;
  longitude?: number | null;
  /** High-level household status for legend/filtering (e.g. 'Active', 'Relocated', '4Ps') */
  status?: string;
  /** Risk classification for legends (e.g. 'flood_prone', 'fire_risk') */
  riskLevel?: string;
  /** Optional zone/cluster identifier for filtering (can mirror purok if needed) */
  barangayZone?: string;
  members: HouseholdMember[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  lastLogin?: string;
  createdAt: string;
  /** For Staff/Admin: used for login. Store hashed in production. */
  password?: string;
}

/**
 * DataService - Main data access layer
 * 
 * This service provides a synchronous API for backward compatibility while
 * using the database abstraction layer internally. To switch to Firebase:
 * 
 * 1. Update the provider in app.config.ts:
 *    { provide: IDatabaseService, useClass: FirebaseDatabaseService }
 * 
 * 2. Or change the constructor injection below to use FirebaseDatabaseService
 */
@Injectable({ 
  providedIn: 'root'
})
export class DataService {
  // Cached data for synchronous access (maintains backward compatibility)
  residents: Resident[] = [];
  requests: CertificateRequest[] = [];
  households: Household[] = [];
  users: SystemUser[] = [];
  roles: Role[] = [];

  // BehaviorSubjects for reactive updates
  private residents$ = new BehaviorSubject<Resident[]>([]);
  private requests$ = new BehaviorSubject<CertificateRequest[]>([]);
  private households$ = new BehaviorSubject<Household[]>([]);
  private users$ = new BehaviorSubject<SystemUser[]>([]);
  private roles$ = new BehaviorSubject<Role[]>([]);

  constructor(
    // To switch to Firebase, inject FirebaseDatabaseService instead:
    // private database: FirebaseDatabaseService
    private database: LocalStorageDatabaseService,
    private audit: AuditLogService,
  ) {
    this.initializeData();
  }

  private async initializeData(): Promise<void> {
    try {
      // Load all data from database
      this.residents = await firstValueFrom(this.database.getResidents());
      this.requests = await firstValueFrom(this.database.getRequests());
      this.households = await firstValueFrom(this.database.getHouseholds());
      this.users = await firstValueFrom(this.database.getUsers());
      this.roles = await firstValueFrom(this.database.getRoles());

      // Update BehaviorSubjects
      this.residents$.next(this.residents);
      this.requests$.next(this.requests);
      this.households$.next(this.households);
      this.users$.next(this.users);
      this.roles$.next(this.roles);

      // Subscribe to changes for real-time updates (useful for Firebase)
      this.database.getResidents().subscribe(residents => {
        this.residents = residents;
        this.residents$.next(residents);
      });

      this.database.getRequests().subscribe(requests => {
        this.requests = requests;
        this.requests$.next(requests);
      });

      this.database.getHouseholds().subscribe(households => {
        this.households = households;
        this.households$.next(households);
      });

      this.database.getUsers().subscribe(users => {
        this.users = users;
        this.users$.next(users);
      });

      this.database.getRoles().subscribe(roles => {
        this.roles = roles;
        this.roles$.next(roles);
      });
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  }

  // Resident methods
  getResidentById(id: string): Resident | undefined {
    if (id == null) return undefined;
    const idStr = String(id);
    return this.residents.find((r) => String(r.id) === idStr);
  }

  getResidentByResidentId(rid: string): Resident | undefined {
    return this.residents.find((r) => r.residentId === rid);
  }

  addResident(resident: Resident): void {
    // Update cache immediately for synchronous access
    this.residents.push(resident);
    this.audit.log({
      action: 'Add resident',
      category: 'resident',
      details: `Added resident: ${resident.name} (${resident.residentId})`,
      entityId: resident.id,
      entityName: resident.name,
    });
    this.residents$.next(this.residents);
    
    // Persist to database asynchronously
    this.database.addResident(resident).subscribe({
      next: () => {
        // Refresh from database to ensure consistency
        this.database.getResidents().subscribe(residents => {
          this.residents = residents;
          this.residents$.next(residents);
        });
      },
      error: (error) => {
        console.error('Error adding resident:', error);
        // Rollback on error
        const index = this.residents.findIndex(r => r.id === resident.id);
        if (index !== -1) {
          this.residents.splice(index, 1);
          this.residents$.next(this.residents);
        }
      }
    });
  }

  updateResident(id: string, updates: Partial<Resident>): void {
    const resident = this.residents.find((r) => r.id === id);
    if (!resident) return;
    
    this.audit.log({
      action: 'Update resident',
      category: 'resident',
      details: `Updated resident: ${resident.name} (${resident.residentId})`,
      entityId: id,
      entityName: resident.name,
    });
    // Update cache immediately
    Object.assign(resident, updates);
    this.residents$.next(this.residents);
    
    // Sync name to household members if name was updated
    if (updates.name !== undefined) {
      this.households.forEach((h) => {
        const member = h.members.find((m) => m.residentId === resident.residentId);
        if (member) {
          member.name = updates.name!;
          // Update household in database
          this.database.updateHousehold(h.id, { members: h.members }).subscribe();
        }
      });
    }
    
    // Persist to database asynchronously
    this.database.updateResident(id, updates).subscribe({
      next: () => {
        // Refresh from database to ensure consistency
        this.database.getResidents().subscribe(residents => {
          this.residents = residents;
          this.residents$.next(residents);
        });
      },
      error: (error) => {
        console.error('Error updating resident:', error);
        // Could rollback here if needed
      }
    });
  }

  // Request methods
  getRequestById(id: string): CertificateRequest | undefined {
    return this.requests.find((r) => r.id === id);
  }

  getRequestsByResidentId(residentId: string): CertificateRequest[] {
    return this.requests.filter((r) => r.residentId === residentId);
  }

  addRequest(request: CertificateRequest): void {
    this.requests.push(request);
    this.audit.log({
      action: 'Add certificate request',
      category: 'request',
      details: `${request.type} - ${request.purpose}`,
      entityId: request.id,
    });
    this.requests$.next(this.requests);
    
    this.database.addRequest(request).subscribe({
      next: () => {
        this.database.getRequests().subscribe(requests => {
          this.requests = requests;
          this.requests$.next(requests);
        });
      },
      error: (error) => {
        console.error('Error adding request:', error);
        const index = this.requests.findIndex(r => r.id === request.id);
        if (index !== -1) {
          this.requests.splice(index, 1);
          this.requests$.next(this.requests);
        }
      }
    });
  }

  updateRequest(id: string, updates: Partial<CertificateRequest>): void {
    const request = this.requests.find((r) => r.id === id);
    if (!request) return;
    
    if (updates.status) {
      this.audit.log({
        action: 'Update request status',
        category: 'request',
        details: `Request ${id}: ${request.status} → ${updates.status}`,
        entityId: id,
      });
    }
    Object.assign(request, updates);
    this.requests$.next(this.requests);
    
    this.database.updateRequest(id, updates).subscribe({
      next: () => {
        this.database.getRequests().subscribe(requests => {
          this.requests = requests;
          this.requests$.next(requests);
        });
      },
      error: (error) => {
        console.error('Error updating request:', error);
      }
    });
  }

  // Household methods
  getHouseholdByResidentId(residentId: string): Household | undefined {
    return this.households.find((h) => 
      h.members.some((m) => m.residentId === residentId)
    );
  }

  getHouseholdByHeadId(headId: string): Household | undefined {
    return this.households.find((h) => h.headId === headId);
  }

  getHouseholdById(id: string): Household | undefined {
    return this.households.find((h) => h.id === id);
  }

  addHousehold(household: Household): void {
    this.households.push(household);
    this.audit.log({
      action: 'Add household',
      category: 'household',
      details: `Added household ${household.householdId} (${household.address})`,
      entityId: household.id,
      entityName: household.householdId,
    });
    this.households$.next(this.households);
    
    this.database.addHousehold(household).subscribe({
      next: () => {
        this.database.getHouseholds().subscribe(households => {
          this.households = households;
          this.households$.next(households);
        });
      },
      error: (error) => {
        console.error('Error adding household:', error);
        const index = this.households.findIndex(h => h.id === household.id);
        if (index !== -1) {
          this.households.splice(index, 1);
          this.households$.next(this.households);
        }
      }
    });
  }

  updateHousehold(id: string, updates: Partial<Household>): void {
    const household = this.households.find((h) => h.id === id);
    if (!household) return;
    
    this.audit.log({
      action: 'Update household',
      category: 'household',
      details: `Updated household ${household.householdId}`,
      entityId: id,
      entityName: household.householdId,
    });
    Object.assign(household, updates);
    this.households$.next(this.households);
    
    this.database.updateHousehold(id, updates).subscribe({
      next: () => {
        this.database.getHouseholds().subscribe(households => {
          this.households = households;
          this.households$.next(households);
        });
      },
      error: (error) => {
        console.error('Error updating household:', error);
      }
    });
  }

  // Stats
  getStats() {
    const senior = this.residents.filter((r) => r.age >= 60).length;
    return { 
      totalResidents: this.residents.length, 
      totalHouseholds: this.households.length, 
      seniorCitizens: senior || 245 
    };
  }

  // User methods
  getUsersByRole(role: string): SystemUser[] {
    return this.users.filter(u => u.role.toLowerCase() === role.toLowerCase());
  }

  addUser(user: SystemUser): void {
    this.users.push(user);
    this.audit.log({
      action: 'Add user',
      category: 'user',
      details: `Added user: ${user.name} (${user.email}) - ${user.role}`,
      entityId: user.id,
      entityName: user.name,
    });
    this.users$.next(this.users);
    
    // Update role user count
    const role = this.roles.find(r => r.name === user.role);
    if (role) {
      role.userCount++;
      this.roles$.next(this.roles);
    }
    
    this.database.addUser(user).subscribe({
      next: () => {
        if (role) {
          this.database.updateRole(role.id, { userCount: role.userCount }).subscribe();
        }
        this.database.getUsers().subscribe(users => {
          this.users = users;
          this.users$.next(users);
        });
        this.database.getRoles().subscribe(roles => {
          this.roles = roles;
          this.roles$.next(roles);
        });
      },
      error: (error) => {
        console.error('Error adding user:', error);
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users.splice(index, 1);
          this.users$.next(this.users);
          if (role) {
            role.userCount--;
            this.roles$.next(this.roles);
          }
        }
      }
    });
  }

  updateUserRole(userId: string, newRole: string): void {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;
    
    this.audit.log({
      action: 'Update user role',
      category: 'user',
      details: `${user.name}: ${user.role} → ${newRole}`,
      entityId: userId,
      entityName: user.name,
    });
    const oldRole = this.roles.find(r => r.name === user.role);
    const newRoleObj = this.roles.find(r => r.name === newRole);
    
    if (oldRole) {
      oldRole.userCount--;
    }
    if (newRoleObj) {
      newRoleObj.userCount++;
    }
    
    user.role = newRole;
    this.users$.next(this.users);
    this.roles$.next(this.roles);
    
    this.database.updateUser(userId, { role: newRole }).subscribe({
      next: () => {
        if (oldRole) {
          this.database.updateRole(oldRole.id, { userCount: oldRole.userCount }).subscribe();
        }
        if (newRoleObj) {
          this.database.updateRole(newRoleObj.id, { userCount: newRoleObj.userCount }).subscribe();
        }
        this.database.getUsers().subscribe(users => {
          this.users = users;
          this.users$.next(users);
        });
        this.database.getRoles().subscribe(roles => {
          this.roles = roles;
          this.roles$.next(roles);
        });
      },
      error: (error) => {
        console.error('Error updating user role:', error);
        // Rollback
        if (oldRole) oldRole.userCount++;
        if (newRoleObj) newRoleObj.userCount--;
        user.role = oldRole?.name || user.role;
        this.users$.next(this.users);
        this.roles$.next(this.roles);
      }
    });
  }

  // Observable getters for reactive components (optional, for future use)
  get residentsObservable() {
    return this.residents$.asObservable();
  }

  get requestsObservable() {
    return this.requests$.asObservable();
  }

  get householdsObservable() {
    return this.households$.asObservable();
  }

  get usersObservable() {
    return this.users$.asObservable();
  }

  get rolesObservable() {
    return this.roles$.asObservable();
  }

  // Role methods
  updateRole(id: string, updates: Partial<Role>): void {
    const role = this.roles.find(r => r.id === id);
    if (!role) return;

    const originalRole: Role = { ...role };

    this.audit.log({
      action: 'Update role',
      category: 'role',
      details: `Updated role: ${role.name}`,
      entityId: id,
      entityName: role.name,
    });

    // Update cache immediately
    Object.assign(role, updates);
    this.roles$.next(this.roles);

    this.database.updateRole(id, updates).subscribe({
      next: () => {
        // Refresh from database to ensure consistency
        this.database.getRoles().subscribe(roles => {
          this.roles = roles;
          this.roles$.next(roles);
        });
      },
      error: (error) => {
        console.error('Error updating role:', error);
        // Rollback on error
        const index = this.roles.findIndex(r => r.id === id);
        if (index !== -1) {
          this.roles[index] = originalRole;
          this.roles$.next(this.roles);
        }
      }
    });
  }
}
