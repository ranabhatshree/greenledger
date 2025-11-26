'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { getSettings, updateSettings } from '@/lib/api/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';

export default function SettingsForm() {
    const { register, handleSubmit, setValue, watch } = useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await getSettings();
                const settings = data.settings;
                setValue('language', settings.language);
                setValue('theme', settings.theme);
                setValue('dateFormat', settings.dateFormat);
                setValue('notificationsEnabled', settings.notificationsEnabled);
                setValue('currencyFormat', settings.currencyFormat);
            } catch (error) {
                toast.error('Failed to load settings');
            }
        };
        fetchSettings();
    }, [setValue]);

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            await updateSettings(data);
            toast.success('Settings updated');
        } catch (error) {
            toast.error('Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
            <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select onValueChange={(val) => setValue('language', val)} value={watch('language')}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select onValueChange={(val) => setValue('theme', val)} value={watch('theme')}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select onValueChange={(val) => setValue('dateFormat', val)} value={watch('dateFormat')}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center justify-between">
                <Label htmlFor="notificationsEnabled">Enable Notifications</Label>
                <Switch
                    id="notificationsEnabled"
                    checked={watch('notificationsEnabled')}
                    onCheckedChange={(val: any) => setValue('notificationsEnabled', val)}
                />
            </div>

            <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
            </Button>
        </form>
    );
}
