'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createRole, updateRole, getPermissions } from '@/lib/api/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';

interface RoleEditorProps {
    role?: any;
    onClose: (refresh: boolean) => void;
}

export default function RoleEditor({ role, onClose }: RoleEditorProps) {
    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
        defaultValues: {
            name: role?.name || '',
            description: role?.description || '',
            permissions: role?.permissions || []
        }
    });
    const [allPermissions, setAllPermissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const selectedPermissions = watch('permissions');

    useEffect(() => {
        const fetchPerms = async () => {
            try {
                const data = await getPermissions();
                setAllPermissions(data.permissions);
            } catch (error) {
                toast.error('Failed to load permissions');
            }
        };
        fetchPerms();
    }, []);

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            // Ensure companyId is handled by backend or added here if needed.
            // Backend roleController expects companyId in body for creation, but it might be inferred from user context?
            // The controller says: `const { companyId } = req.query; // Or from req.user.companyId`
            // But createRole schema requires companyId.
            // Let's assume the backend infers it from the user's companyId if not provided, or we need to fetch user's companyId.
            // For now, let's send a dummy or rely on backend fix.
            // Actually, the backend `createRole` controller: `const role = new Role(req.body);`
            // And schema: `companyId: Joi.string().required()`.
            // So we MUST send companyId.
            // We should get it from the auth store.

            // For this implementation, I'll assume the backend has been updated to use req.user.companyId if not provided,
            // OR I need to get it from Redux.
            // Let's get it from Redux (localStorage for now as quick fix or assume user is loaded).
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const payload = { ...data, companyId: user.companyId };

            if (role) {
                await updateRole(role._id, payload);
                toast.success('Role updated');
            } else {
                await createRole(payload);
                toast.success('Role created');
            }
            onClose(true);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save role');
        } finally {
            setLoading(false);
        }
    };

    const handlePermissionToggle = (permName: string) => {
        const current = selectedPermissions || [];
        if (current.includes(permName)) {
            setValue('permissions', current.filter((p: string) => p !== permName));
        } else {
            setValue('permissions', [...current, permName]);
        }
    };

    // Group permissions by category
    const groupedPermissions = allPermissions.reduce((acc: any, perm: any) => {
        if (!acc[perm.category]) acc[perm.category] = [];
        acc[perm.category].push(perm);
        return acc;
    }, {});

    return (
        <Dialog open={true} onOpenChange={() => onClose(false)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{role ? 'Edit Role' : 'Create New Role'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Role Name</Label>
                        <Input id="name" {...register('name', { required: 'Name is required' })} />
                        {errors.name && <span className="text-red-500 text-sm">{errors.name.message as string}</span>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" {...register('description')} />
                    </div>

                    <div className="space-y-4">
                        <Label>Permissions</Label>
                        {Object.entries(groupedPermissions).map(([category, perms]: [string, any]) => (
                            <div key={category} className="border p-4 rounded-md">
                                <h4 className="font-semibold mb-2">{category}</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {perms.map((perm: any) => (
                                        <div key={perm._id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={perm.name}
                                                checked={selectedPermissions?.includes(perm.name)}
                                                onCheckedChange={() => handlePermissionToggle(perm.name)}
                                            />
                                            <label htmlFor={perm.name} className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                {perm.description}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onClose(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Role'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
