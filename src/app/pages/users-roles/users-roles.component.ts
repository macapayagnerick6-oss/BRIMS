import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, SystemUser, Role } from '../../services/data.service';
import Swal from 'sweetalert2';

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

  get users(): SystemUser[] {
    return this.data.getActiveUsers();
  }

  get roles(): Role[] {
    return this.data.roles;
  }

  showAddUserForm = false;
  addUserError = '';

  // Role modal state
  showRoleModal = false;
  modalMode: 'role' | 'permissions' = 'role';
  activeRole: Role | null = null;
  modalDescription = '';
  modalPermissions: string[] = [];
  newPermission = '';
  isRoleModalClosing = false;
  private roleModalCloseTimeout: ReturnType<typeof setTimeout> | null = null;

  newUser: Partial<SystemUser> & { firstName?: string; middleName?: string; lastName?: string } = {
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    role: 'Resident',
    status: 'Active',
    password: '',
  };

  get filteredUsers(): SystemUser[] {
    // Exclude archived users from the main Users list
    let result = this.users.filter(u => !u.archived);
    
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
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      role: 'Resident',
      status: 'Active',
      password: '',
    };
  }

  submitNewUser(): void {
    if (!this.newUser.firstName?.trim() || !this.newUser.lastName?.trim() || !this.newUser.email?.trim() || !this.newUser.role) {
      this.addUserError = 'Please enter first name, last name, email, and role.';
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

    const fullName = [this.newUser.firstName!.trim(), this.newUser.middleName?.trim(), this.newUser.lastName!.trim()]
      .filter(Boolean)
      .join(' ');

    const user: SystemUser = {
      id: nextId,
      name: fullName,
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

  async removeUser(user: SystemUser): Promise<void> {
    const result = await Swal.fire({
      title: 'Remove user?',
      text: `Remove user "${user.name}" (${user.email})? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusCancel: true,
    });
    if (!result.isConfirmed) {
      return;
    }
    this.data.removeUser(user.id);
    await Swal.fire({
      title: 'Removed',
      text: 'The user account has been deleted.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    });
  }

  async archiveUser(user: SystemUser): Promise<void> {
    if (user.role !== 'Admin' && user.role !== 'Staff') {
      await Swal.fire({
        icon: 'warning',
        title: 'Cannot archive user',
        text: 'Only Admin and Staff accounts can be archived.',
        confirmButtonText: 'OK',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Archive user?',
      text: `Archive user "${user.name}" (${user.email})? They will move to Archives and be hidden from this list.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, archive',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusCancel: true,
    });
    if (!result.isConfirmed) {
      return;
    }

    this.data.archiveUser(user.id);
    await Swal.fire({
      title: 'Archived',
      text: 'The user has been moved to Archives.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    });
  }

  // Role modal
  openRoleModal(role: Role, mode: 'role' | 'permissions' = 'role'): void {
    if (this.roleModalCloseTimeout) {
      clearTimeout(this.roleModalCloseTimeout);
      this.roleModalCloseTimeout = null;
    }

    this.activeRole = role;
    this.modalMode = mode;
    this.modalDescription = role.description;
    this.modalPermissions = [...role.permissions];
    this.newPermission = '';
    this.isRoleModalClosing = false;
    this.showRoleModal = true;
  }

  closeRoleModal(): void {
    if (!this.showRoleModal || this.isRoleModalClosing) {
      return;
    }

    this.isRoleModalClosing = true;

    this.roleModalCloseTimeout = setTimeout(() => {
      this.showRoleModal = false;
      this.isRoleModalClosing = false;
      this.activeRole = null;
      this.modalDescription = '';
      this.modalPermissions = [];
      this.newPermission = '';
      this.roleModalCloseTimeout = null;
    }, 200);
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
