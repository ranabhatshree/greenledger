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
import { Loader } from '@/components/ui/loader';

interface CompanyFormProps {
    onComplete: () => void;
}

interface CompanyFormData {
    companyName: string;
    companyType: string;
    address: string;
    currency: string;
    timezone: string;
    fiscalYearStartMonth: string;
}

export default function CompanyForm({ onComplete }: CompanyFormProps) {
    const { register, handleSubmit, formState: { errors }, control } = useForm<CompanyFormData>({
        defaultValues: {
            currency: 'NPR',
            timezone: 'Asia/Kathmandu',
            fiscalYearStartMonth: 'July'
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

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">Setup Your Company</h2>
                <p className="text-muted-foreground">Tell us about your business</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Hidden fields for form submission */}
                <input type="hidden" {...register('currency')} value="NPR" />
                <input type="hidden" {...register('timezone')} value="Asia/Kathmandu" />
                <input type="hidden" {...register('fiscalYearStartMonth')} value="July" />

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
                        <Input 
                            id="currency" 
                            value="NPR" 
                            disabled 
                            className="bg-gray-100 cursor-not-allowed"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Input 
                            id="timezone" 
                            value="Asia/Kathmandu" 
                            disabled 
                            className="bg-gray-100 cursor-not-allowed"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="fiscalYearStartMonth">Fiscal Year Start Month</Label>
                    <Input 
                        id="fiscalYearStartMonth" 
                        value="July" 
                        disabled 
                        className="bg-gray-100 cursor-not-allowed"
                    />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating...' : 'Continue'}
                </Button>
            </form>
        </div>
    );
}
