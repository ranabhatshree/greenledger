'use client';

import { useState, useEffect } from 'react';
import { getRoles, deleteRole } from '@/lib/api/roles';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Plus } from 'lucide-react';
import RoleEditor from './RoleEditor';

export default function RoleList() {
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<any | null>(null);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const data = await getRoles();
            setRoles(data.roles);
        } catch (error) {
            toast.error('Failed to fetch roles');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this role?')) return;
        try {
            await deleteRole(id);
            toast.success('Role deleted');
            fetchRoles();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete role');
        }
    };

    const handleEdit = (role: any) => {
        setEditingRole(role);
        setIsEditorOpen(true);
    };

    const handleCreate = () => {
        setEditingRole(null);
        setIsEditorOpen(true);
    };

    const handleEditorClose = (shouldRefresh: boolean) => {
        setIsEditorOpen(false);
        setEditingRole(null);
        if (shouldRefresh) {
            fetchRoles();
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Roles & Permissions</h2>
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Role
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                            </TableRow>
                        ) : roles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">No roles found</TableCell>
                            </TableRow>
                        ) : (
                            roles.map((role) => (
                                <TableRow key={role._id}>
                                    <TableCell className="font-medium">{role.name}</TableCell>
                                    <TableCell>{role.description}</TableCell>
                                    <TableCell>
                                        {role.isSystemRole ? (
                                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">System</span>
                                        ) : (
                                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Custom</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {!role.isSystemRole && (
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(role)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(role._id)}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        )}
                                        {role.isSystemRole && (
                                            <span className="text-muted-foreground text-sm italic">Read-only</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {isEditorOpen && (
                <RoleEditor
                    role={editingRole}
                    onClose={handleEditorClose}
                />
            )}
        </div>
    );
}
