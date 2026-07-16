export type UserRole = 'admin' | 'seller' | 'viewer';

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    { resource: 'products', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'families', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'clients', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'inventory', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'settings', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'backup', actions: ['create', 'read', 'update', 'delete'] },
  ],
  seller: [
    { resource: 'products', actions: ['read'] },
    { resource: 'families', actions: ['read'] },
    { resource: 'clients', actions: ['create', 'read', 'update'] },
    { resource: 'inventory', actions: ['read'] },
    { resource: 'orders', actions: ['create', 'read'] },
  ],
  viewer: [
    { resource: 'products', actions: ['read'] },
    { resource: 'families', actions: ['read'] },
    { resource: 'clients', actions: ['read'] },
    { resource: 'inventory', actions: ['read'] },
  ],
};

export class PermissionsService {
  private static instance: PermissionsService;
  private currentRole: UserRole = 'viewer';

  private constructor() {}

  static getInstance(): PermissionsService {
    if (!PermissionsService.instance) {
      PermissionsService.instance = new PermissionsService();
    }
    return PermissionsService.instance;
  }

  setRole(role: UserRole): void {
    this.currentRole = role;
  }

  getRole(): UserRole {
    return this.currentRole;
  }

  hasPermission(resource: string, action: string): boolean {
    const permissions = ROLE_PERMISSIONS[this.currentRole];
    const resourcePermission = permissions.find(p => p.resource === resource);
    
    if (!resourcePermission) return false;
    
    return resourcePermission.actions.includes(action as any);
  }

  canCreate(resource: string): boolean {
    return this.hasPermission(resource, 'create');
  }

  canRead(resource: string): boolean {
    return this.hasPermission(resource, 'read');
  }

  canUpdate(resource: string): boolean {
    return this.hasPermission(resource, 'update');
  }

  canDelete(resource: string): boolean {
    return this.hasPermission(resource, 'delete');
  }

  getPermissionsForRole(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role];
  }

  getAllRoles(): UserRole[] {
    return ['admin', 'seller', 'viewer'];
  }
}

export const permissions = PermissionsService.getInstance();
