import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  action: string;
  category: 'auth' | 'resident' | 'household' | 'user' | 'request' | 'system' | 'role';
  userId?: string;
  userName?: string;
  userEmail?: string;
  details?: string;
  entityId?: string;
  entityName?: string;
}

const STORAGE_KEY = 'brims_audit_log';
const MAX_ENTRIES = 2000;

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private logs$ = new BehaviorSubject<AuditLogEntry[]>([]);

  constructor(private injector: Injector) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const logs: AuditLogEntry[] = raw ? JSON.parse(raw) : [];
      this.logs$.next(logs);
    } catch {
      this.logs$.next([]);
    }
  }

  private saveToStorage(logs: AuditLogEntry[]): void {
    try {
      const trimmed = logs.slice(-MAX_ENTRIES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      this.logs$.next(trimmed);
    } catch (e) {
      console.error('Error saving audit log:', e);
    }
  }

  /** Get all audit log entries (newest first). */
  getLogs(): AuditLogEntry[] {
    const logs = this.logs$.value;
    return [...logs].reverse();
  }

  getLogsObservable(): Observable<AuditLogEntry[]> {
    return this.logs$.asObservable();
  }

  /**
   * Record an audit log entry. Call this from AuthService, DataService, or components.
   */
  log(params: {
    action: string;
    category: AuditLogEntry['category'];
    userId?: string;
    userName?: string;
    userEmail?: string;
    details?: string;
    entityId?: string;
    entityName?: string;
  }): void {
    const user = this.injector.get(AuthService).currentUser;
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date().toISOString(),
      action: params.action,
      category: params.category,
      userId: params.userId ?? user?.id,
      userName: params.userName ?? user?.name,
      userEmail: params.userEmail ?? user?.email,
      details: params.details,
      entityId: params.entityId,
      entityName: params.entityName,
    };
    const logs = this.logs$.value;
    logs.push(entry);
    this.saveToStorage(logs);
  }
}
