'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { createCompany } from '@/lib/api/onboarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { setUser } from '@/lib/features/auth/authSlice';

interface CompanyFormProps {
    onComplete: () => void;
}

interface CompanyFormData {
    companyName: string;
    companyType: string;
    address: string;
    currency: string;
    timezone: string;
}

export default function CompanyForm({ onComplete }: CompanyFormProps) {
    const { register, handleSubmit, formState: { errors }, control } = useForm<CompanyFormData>({
        defaultValues: {
            currency: 'NPR',
            timezone: 'Asia/Kathmandu'
        }
    });
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const onSubmit = async (data: CompanyFormData) => {
        setLoading(true);
        try {
            const response = await createCompany(data);
            toast.success('Company created successfully!');
            // Update user in store if backend returns updated user or we fetch it again
            // For now, just proceed
            onComplete();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create company');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">Setup Your Company</h2>
                <p className="text-muted-foreground">Tell us about your business</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" {...register('companyName', { required: 'Company name is required' })} />
                    {errors.companyName && <span className="text-red-500 text-sm">{errors.companyName.message as string}</span>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="companyType">Company Type</Label>
                    <Controller
                        name="companyType"
                        control={control}
                        rules={{ required: 'Company type is required' }}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Retail">Retail</SelectItem>
                                    <SelectItem value="Services">Services</SelectItem>
                                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.companyType && <span className="text-red-500 text-sm">{errors.companyType.message as string}</span>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" {...register('address', { required: 'Address is required' })} />
                    {errors.address && <span className="text-red-500 text-sm">{errors.address.message as string}</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Controller
                            name="currency"
                            control={control}
                            rules={{ required: 'Currency is required' }}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NPR">NPR</SelectItem>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                        <SelectItem value="INR">INR</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.currency && <span className="text-red-500 text-sm">{errors.currency.message as string}</span>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Controller
                            name="timezone"
                            control={control}
                            rules={{ required: 'Timezone is required' }}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select timezone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Asia/Kathmandu">Asia/Kathmandu</SelectItem>
                                        <SelectItem value="UTC">UTC</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.timezone && <span className="text-red-500 text-sm">{errors.timezone.message as string}</span>}
                    </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating...' : 'Continue'}
                </Button>
            </form>
        </div>
    );
}
