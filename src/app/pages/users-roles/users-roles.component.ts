import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, SystemUser, Role } from '../../services/data.service';

@Component({
  selector: 'app-users-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-roles.component.html',
  styleUrls: ['./users-roles.component.scss'],
})
export class UsersRolesComponent {
  constructor(public data: DataService) {}

  activeTab: 'users' | 'roles' = 'users';
  search = '';
  roleFilter = '';
  statusFilter = '';

  users = this.data.users;
  roles = this.data.roles;

  showAddUserForm = false;
  addUserError = '';

  // Role modal state
  showRoleModal = false;
  modalMode: 'role' | 'permissions' = 'role';
  activeRole: Role | null = null;
  modalDescription = '';
  modalPermissions: string[] = [];
  newPermission = '';

  newUser: Partial<SystemUser> = {
    name: '',
    email: '',
    role: 'Resident',
    status: 'Active',
    password: '',
  };

  get filteredUsers(): SystemUser[] {
    let result = [...this.users];
    
    if (this.search) {
      const searchLower = this.search.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower)
      );
    }
    
    if (this.roleFilter) {
      result = result.filter(u => u.role === this.roleFilter);
    }
    
    if (this.statusFilter) {
      result = result.filter(u => u.status === this.statusFilter);
    }
    
    return result;
  }

  openAddUserForm(): void {
    this.resetNewUser();
    this.addUserError = '';
    this.showAddUserForm = true;
  }

  closeAddUserForm(): void {
    this.showAddUserForm = false;
    this.addUserError = '';
  }

  private resetNewUser(): void {
    this.newUser = {
      name: '',
      email: '',
      role: 'Resident',
      status: 'Active',
      password: '',
    };
  }

  submitNewUser(): void {
    if (!this.newUser.name?.trim() || !this.newUser.email?.trim() || !this.newUser.role) {
      this.addUserError = 'Please enter name, email, and role.';
      return;
    }

    const email = this.newUser.email.trim();
    const emailPattern = /\S+@\S+\.\S+/;
    if (!emailPattern.test(email)) {
      this.addUserError = 'Please enter a valid email address.';
      return;
    }

    const role = this.newUser.role!;
    const needsPassword = role === 'Staff' || role === 'Admin';
    if (needsPassword && !this.newUser.password?.trim()) {
      this.addUserError = 'Please set a password so this user can log in.';
      return;
    }

    const nextId = (this.data.users.length + 1).toString();
    const now = new Date();
    const createdAt = now.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });

    const user: SystemUser = {
      id: nextId,
      name: this.newUser.name.trim(),
      email,
      role,
      status: this.newUser.status || 'Active',
      lastLogin: 'Never',
      createdAt,
      password: needsPassword ? this.newUser.password?.trim() : undefined,
    };

    this.data.addUser(user);
    this.closeAddUserForm();
  }

  setActiveTab(tab: 'users' | 'roles'): void {
    this.activeTab = tab;
  }

  getRoleBadgeClass(role: string): string {
    const roleLower = role.toLowerCase();
    if (roleLower === 'admin') return 'badge--warning';
    if (roleLower === 'staff') return 'badge--info';
    return 'badge--success';
  }

  getStatusBadgeClass(status: string): string {
    return status === 'Active' ? 'badge--success' : 'badge--warning';
  }

  updateUserRole(userId: string, newRole: string): void {
    this.data.updateUserRole(userId, newRole);
  }

  toggleUserStatus(userId: string): void {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.status = user.status === 'Active' ? 'Inactive' : 'Active';
    }
  }

  // Role modal
  openRoleModal(role: Role, mode: 'role' | 'permissions' = 'role'): void {
    this.activeRole = role;
    this.modalMode = mode;
    this.modalDescription = role.description;
    this.modalPermissions = [...role.permissions];
    this.newPermission = '';
    this.showRoleModal = true;
  }

  closeRoleModal(): void {
    this.showRoleModal = false;
    this.activeRole = null;
    this.modalDescription = '';
    this.modalPermissions = [];
    this.newPermission = '';
  }

  saveRoleModal(): void {
    if (!this.activeRole) return;
    const description = this.modalDescription.trim();
    const cleanedPermissions = this.modalPermissions
      .map(p => p.trim())
      .filter(p => !!p);

    this.data.updateRole(this.activeRole.id, {
      description,
      permissions: cleanedPermissions,
    });

    this.closeRoleModal();
  }

  addPermission(): void {
    const value = this.newPermission.trim();
    if (!value) return;
    if (!this.modalPermissions.includes(value)) {
      this.modalPermissions.push(value);
    }
    this.newPermission = '';
  }

  removePermission(index: number): void {
    if (index < 0 || index >= this.modalPermissions.length) return;
    this.modalPermissions.splice(index, 1);
  }
}
