'use client';

import { useState } from 'react';
import { uploadProfilePicture } from '@/lib/api/onboarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader } from '@/components/ui/loader';

export default function ProfileUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        try {
            await uploadProfilePicture(file);
            toast.success('Profile picture uploaded!');
            router.push('/dashboard'); // Redirect to dashboard after completion
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to upload');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        router.push('/dashboard');
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="space-y-6 text-center">
            <div>
                <h2 className="text-2xl font-bold">Add a Profile Picture</h2>
                <p className="text-muted-foreground">Personalize your account</p>
            </div>

            <div className="flex flex-col items-center space-y-4">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 relative">
                    {preview ? (
                        <Image src={preview} alt="Preview" fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span>No Image</span>
                        </div>
                    )}
                </div>

                <div className="w-full max-w-xs">
                    <Label htmlFor="picture" className="sr-only">Picture</Label>
                    <Input id="picture" type="file" accept="image/*" onChange={handleFileChange} />
                </div>
            </div>

            <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={handleSkip}>Skip</Button>
                <Button onClick={handleUpload} disabled={!file || loading}>
                    {loading ? 'Uploading...' : 'Upload & Finish'}
                </Button>
            </div>
        </div>
    );
}
