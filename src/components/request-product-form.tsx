'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createProductRequest } from '@/app/request-product/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Image as ImageIcon, X } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Submitting Request...
        </>
      ) : (
        'Submit Request'
      )}
    </Button>
  );
}

export function RequestProductForm() {
    const { toast } = useToast();
    const initialState = { message: '', error: undefined, success: false };
    const [state, dispatch] = useActionState(createProductRequest, initialState);
    
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    
    const formRef = useRef<HTMLFormElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (state.success) {
            toast({ variant: 'success', title: 'Request Submitted!', description: state.message });
            formRef.current?.reset();
            setImagePreview(null);
            setSelectedFile(null);
        } else if (state.error) {
            toast({ variant: 'destructive', title: 'Submission Failed', description: state.error });
        }
    }, [state, toast]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setSelectedFile(file);

        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    const handleFormAction = (formData: FormData) => {
        if (selectedFile) {
            formData.set('image', selectedFile);
        }
        dispatch(formData);
    };

    return (
        <form ref={formRef} action={handleFormAction} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="product_name">Product Name</Label>
                <Input
                    id="product_name"
                    name="product_name"
                    placeholder="e.g., Anker Power Bank 20000mAh"
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Product Description</Label>
                <Textarea
                    id="description"
                    name="description"
                    placeholder="Please be as descriptive as possible. Include brand, model, size, color, etc."
                    rows={3}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="image">Product Image (Optional)</Label>
                {imagePreview ? (
                    <div className="relative w-32 h-32">
                        <img src={imagePreview} alt="Image Preview" className="rounded-md object-cover w-full h-full" />
                        <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={handleRemoveImage}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="image" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted/50">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                                <p className="text-xs text-muted-foreground">PNG, JPG or WEBP (MAX. 5MB)</p>
                            </div>
                            <Input ref={fileInputRef} id="image" name="image" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                        </label>
                    </div> 
                )}
                 {selectedFile && (
                  <p className="text-xs text-muted-foreground mt-2">Selected: {selectedFile.name}</p>
                )}
            </div>
            <SubmitButton />
        </form>
    );
}
