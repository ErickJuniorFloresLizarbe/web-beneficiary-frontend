// src/app/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environments';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            environment.supabaseStorage.supabaseUrl,
            environment.supabaseStorage.supabaseKey,
        );
    }

    async uploadImage(file: File, path: string): Promise<string | null> {
        const fileName = `${Date.now()}_${file.name}`;
        const { data, error } = await this.supabase
            .storage
            .from(environment.supabaseStorage.supabaseBucket)
            .upload(`${path}/${fileName}`, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('❌ Error al subir a Supabase:', error);
            return null;
        }

        return `${this.supabase.storage.from(environment.supabaseStorage.supabaseBucket).getPublicUrl(`${path}/${fileName}`).data.publicUrl}`;
    }

    async deleteImage(path: string): Promise<void> {
        await this.supabase.storage.from(environment.supabaseStorage.supabaseBucket).remove([path]);
    }
}
