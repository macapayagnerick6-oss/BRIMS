import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService, AuditLogEntry } from '../../services/audit-log.service';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.scss'],
})
export class AuditLogComponent implements OnInit {
  logs = signal<AuditLogEntry[]>([]);
  categoryFilter = signal<string>('');
  searchText = signal<string>('');

  filteredLogs = computed(() => {
    let list = this.logs();
    const cat = this.categoryFilter().toLowerCase();
    const search = this.searchText().trim().toLowerCase();
    if (cat) {
      list = list.filter((e) => e.category.toLowerCase() === cat);
    }
    if (search) {
      list = list.filter(
        (e) =>
          e.action.toLowerCase().includes(search) ||
          (e.userName?.toLowerCase().includes(search)) ||
          (e.userEmail?.toLowerCase().includes(search)) ||
          (e.details?.toLowerCase().includes(search)) ||
          (e.entityName?.toLowerCase().includes(search))
      );
    }
    return list;
  });

  categories: { value: string; label: string }[] = [
    { value: '', label: 'All categories' },
    { value: 'auth', label: 'Auth' },
    { value: 'resident', label: 'Resident' },
    { value: 'household', label: 'Household' },
    { value: 'user', label: 'User' },
    { value: 'request', label: 'Request' },
    { value: 'system', label: 'System' },
  ];

  constructor(private audit: AuditLogService) {}

  ngOnInit(): void {
    this.logs.set(this.audit.getLogs());
  }

  onCategoryChange(value: string): void {
    this.categoryFilter.set(value);
  }

  onSearchInput(value: string): void {
    this.searchText.set(value);
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  categoryLabel(category: string): string {
    const c = this.categories.find((x) => x.value === category);
    return c ? c.label : category;
  }
}
