import { Injectable, inject, Inject } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { IDatabaseService, DATABASE_SERVICE } from './database.interface';
import { AuditLogService } from './audit-log.service';
import { NotificationService } from './notification.service';
import { ErrorHandlerService } from './error-handler.service';

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
  /** Profile picture (data URL) – visible to staff viewing this resident */
  profilePicture?: string;
  /** Soft-archive flag: when true, record is moved to Archives and hidden from regular lists. */
  archived?: boolean;
  /** When this resident was archived (ISO string). */
  archivedAt?: string;
  /** Optional reason for archiving (e.g. moved out, deceased). */
  archivedReason?: string;
}

export interface CertificateRequest {
  id: string;
  type: string;
  purpose: string;
  status: 'Approved' | 'Pending' | 'For Review' | 'Rejected';
  date: string;
  residentId?: string;
  /** Soft-archive flag for old/completed requests. */
  archived?: boolean;
  /** When this request was archived (ISO string). */
  archivedAt?: string;
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
  /** Soft-archive flag for inactive/relocated/merged households. */
  archived?: boolean;
  /** When this household was archived (ISO string). */
  archivedAt?: string;
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
  /** Profile picture (data URL) – visible to others who can see this user */
  profilePicture?: string;
  /** Soft-archive flag for former staff/admin accounts. */
  archived?: boolean;
  /** When this user was archived (ISO string). */
  archivedAt?: string;
}

/**
 * DataService - Main data access layer
 * 
 * This service provides a synchronous API for backward compatibility while
 * using the database abstraction layer internally. To switch to Firebase:
 * 
 * 1. Update the provider in app.config.ts:
 *    { provide: IDatabaseService, useClass: FirebaseDatabaseService }
 *    or useClass: JsonServerDatabaseService for JSON Server (temporary backend).
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

  private notificationService = inject(NotificationService);
  private errorHandler = inject(ErrorHandlerService);

  constructor(
    @Inject(DATABASE_SERVICE) private database: IDatabaseService,
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

      // Apply auto-archive rules for old/inactive records (runs once on startup).
      this.applyAutoArchiveRules();
    } catch (error) {
      this.errorHandler.handleErrorWithContext(error, {
        component: 'DataService',
        action: 'initialize data',
      });
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

  /** Residents that are not archived (shown in regular lists and reports). */
  getActiveResidents(): Resident[] {
    return this.residents.filter(r => !r.archived);
  }

  /** Residents that have been archived (shown only in Archives). */
  getArchivedResidents(): Resident[] {
    return this.residents.filter(r => !!r.archived);
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
        // No-op: cache is already updated optimistically
      },
      error: (error) => {
        this.errorHandler.handleErrorWithContext(error, {
          component: 'DataService',
          action: 'add resident',
        });
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
        // No-op: cache is already updated optimistically
      },
      error: (error) => {
        this.errorHandler.handleErrorWithContext(error, {
          component: 'DataService',
          action: 'update resident',
        });
        // Could rollback here if needed
      }
    });
  }

  /** Mark a resident as archived (e.g. moved out, deceased, former resident). */
  archiveResident(id: string, reason?: string): void {
    const resident = this.residents.find(r => r.id === id);
    if (!resident || resident.archived) return;
    const now = new Date().toISOString();
    this.updateResident(id, {
      archived: true,
      archivedAt: now,
      archivedReason: reason,
    });
  }

  /** Restore an archived resident so they appear again in regular lists. */
  unarchiveResident(id: string): void {
    const resident = this.residents.find(r => r.id === id);
    if (!resident || !resident.archived) return;
    this.updateResident(id, {
      archived: false,
      archivedAt: undefined,
      archivedReason: undefined,
    });
  }

  // Request methods
  getRequestById(id: string): CertificateRequest | undefined {
    return this.requests.find((r) => r.id === id);
  }

  getRequestsByResidentId(residentId: string): CertificateRequest[] {
    return this.requests.filter((r) => r.residentId === residentId);
  }

  /** Requests that are not archived (active / recent). */
  getActiveRequests(): CertificateRequest[] {
    return this.requests.filter(r => !r.archived);
  }

  /** Requests that have been archived (old/completed). */
  getArchivedRequests(): CertificateRequest[] {
    return this.requests.filter(r => !!r.archived);
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
        // No-op: cache is already updated optimistically
      },
      error: (error) => {
        this.errorHandler.handleErrorWithContext(error, {
          component: 'DataService',
          action: 'add certificate request',
        });
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
        // No-op: cache is already updated optimistically
      },
      error: (error) => {
        this.errorHandler.handleErrorWithContext(error, {
          component: 'DataService',
          action: 'update certificate request',
        });
      }
    });
  }

  /** Mark a request as archived, typically after it has been completed and is old. */
  archiveRequest(id: string): void {
    const request = this.requests.find(r => r.id === id);
    if (!request || request.archived) return;
    const now = new Date().toISOString();
    this.updateRequest(id, {
      archived: true,
      archivedAt: now,
    });
  }

  /** Restore a previously archived request so it appears again in regular lists. */
  unarchiveRequest(id: string): void {
    const request = this.requests.find(r => r.id === id);
    if (!request || !request.archived) return;
    this.updateRequest(id, {
      archived: false,
      archivedAt: undefined,
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

  /** Households that are not archived (active). */
  getActiveHouseholds(): Household[] {
    return this.households.filter(h => !h.archived);
  }

  /** Households that have been archived (inactive / merged / relocated). */
  getArchivedHouseholds(): Household[] {
    return this.households.filter(h => !!h.archived);
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
        // No-op: cache is already updated optimistically
      },
      error: (error) => {
        this.errorHandler.handleErrorWithContext(error, {
          component: 'DataService',
          action: 'add household',
        });
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
        // No-op: cache is already updated optimistically
      },
      error: (error) => {
        this.errorHandler.handleErrorWithContext(error, {
          component: 'DataService',
          action: 'update household',
        });
      }
    });
  }

  // Stats
  getStats() {
    const activeResidents = this.getActiveResidents();
    const activeHouseholds = this.getActiveHouseholds();
    const senior = activeResidents.filter((r) => r.age >= 60).length;
    return {
      totalResidents: activeResidents.length,
      totalHouseholds: activeHouseholds.length,
      seniorCitizens: senior,
    };
  }

  // User methods
  getUsersByRole(role: string): SystemUser[] {
    return this.users.filter(u => u.role.toLowerCase() === role.toLowerCase() && !u.archived);
  }

  /** Users (staff/admin/resident) that are not archived. */
  getActiveUsers(): SystemUser[] {
    return this.users.filter(u => !u.archived);
  }

  /** Archived users, typically former staff/admin accounts. */
  getArchivedUsers(): SystemUser[] {
    return this.users.filter(u => !!u.archived);
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
      },
      error: (error) => {
        this.errorHandler.handleErrorWithContext(error, {
          component: 'DataService',
          action: 'add user',
        });
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

  removeUser(userId: string): void {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;

    this.audit.log({
      action: 'Remove user',
      category: 'user',
      details: `Removed user: ${user.name} (${user.email}) - ${user.role}`,
      entityId: userId,
      entityName: user.name,
    });

    const role = this.roles.find(r => r.name === user.role);
    if (role) {
      role.userCount--;
      this.roles$.next(this.roles);
    }
    const index = this.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      this.users.splice(index, 1);
      this.users$.next(this.users);
    }

    this.database.deleteUser(userId).subscribe({
      next: () => {
        if (role) {
          this.database.updateRole(role.id, { userCount: role.userCount }).subscribe();
        }
      },
      error: (error) => {
        this.errorHandler.handleErrorWithContext(error, {
          component: 'DataService',
          action: 'remove user',
        });
        if (role) role.userCount++;
        this.users.push(user);
        this.users$.next(this.users);
        this.roles$.next(this.roles);
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
      },
      error: (error) => {
        this.errorHandler.handleErrorWithContext(error, {
          component: 'DataService',
          action: 'update user role',
        });
        // Rollback
        if (oldRole) oldRole.userCount++;
        if (newRoleObj) newRoleObj.userCount--;
        user.role = oldRole?.name || user.role;
        this.users$.next(this.users);
        this.roles$.next(this.roles);
      }
    });
  }

  /** Update any user fields (e.g. profile picture). Use updateUserRole for role changes. */
  updateUser(userId: string, updates: Partial<SystemUser>): void {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;
    const originalUser: SystemUser = { ...user };
    Object.assign(user, updates);
    this.users$.next(this.users);
    this.database.updateUser(userId, updates).subscribe({
      next: () => {
        // No-op: cache is already updated optimistically
      },
      error: (error) => {
        this.errorHandler.handleErrorWithContext(error, {
          component: 'DataService',
          action: 'update user',
        });
        const index = this.users.findIndex(u => u.id === userId);
        if (index !== -1) {
          this.users[index] = originalUser;
          this.users$.next(this.users);
        }
      }
    });
  }

  /** Archive a user account (e.g. former staff). Status is typically already Inactive. */
  archiveUser(userId: string): void {
    const user = this.users.find(u => u.id === userId);
    if (!user || user.archived) return;
    const now = new Date().toISOString();
    this.updateUser(userId, {
      archived: true,
      archivedAt: now,
    });
  }

  /** Restore an archived user account back to active visibility. */
  unarchiveUser(userId: string): void {
    const user = this.users.find(u => u.id === userId);
    if (!user || !user.archived) return;
    this.updateUser(userId, {
      archived: false,
      archivedAt: undefined,
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
        // No-op: cache is already updated optimistically
      },
      error: (error) => {
        this.errorHandler.handleErrorWithContext(error, {
          component: 'DataService',
          action: 'update role',
        });
        // Rollback on error
        const index = this.roles.findIndex(r => r.id === id);
        if (index !== -1) {
          this.roles[index] = originalRole;
          this.roles$.next(this.roles);
        }
      }
    });
  }

  // Internal helpers for archives / auto-archive

  /** Best-effort date parser that tolerates the formatted date strings used in demo data. */
  private parseDate(value: string | undefined): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  /** Automatically archive very old requests and long-inactive users based on simple time rules. */
  private applyAutoArchiveRules(): void {
    const now = Date.now();
    const monthMs = 30 * 24 * 60 * 60 * 1000;

    // Requests: auto-archive approved/rejected requests older than 12 months.
    const requestsThreshold = now - 12 * monthMs;
    this.requests.forEach(req => {
      if (req.archived) return;
      const requestDate = this.parseDate(req.date);
      if (!requestDate) return;
      const isOld = requestDate.getTime() < requestsThreshold;
      const isFinalStatus = req.status === 'Approved' || req.status === 'Rejected';
      if (isOld && isFinalStatus) {
        this.archiveRequest(req.id);
      }
    });

    // Users: auto-archive Inactive users whose last login (or createdAt) is older than 24 months.
    const usersThreshold = now - 24 * monthMs;
    this.users.forEach(user => {
      if (user.archived) return;
      if (user.status !== 'Inactive') return;
      const referenceDate = this.parseDate(user.lastLogin || user.createdAt);
      if (!referenceDate) return;
      const isOld = referenceDate.getTime() < usersThreshold;
      if (isOld) {
        this.archiveUser(user.id);
      }
    });
  }
}
