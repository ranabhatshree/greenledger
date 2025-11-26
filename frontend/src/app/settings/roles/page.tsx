'use client';

import RoleList from '@/components/roles/RoleList';

export default function RolesPage() {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Role Management</h1>
            <RoleList />
        </div>
    );
}
