import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

// Admin client for storage management
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function main() {
  console.log('🚀 Setting up Supabase for HealthDoc...')

  try {
    // ==========================================
    // 1. Storage Buckets
    // ==========================================
    console.log('\n📦 Configuring Storage...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    if (listError) throw listError
    
    const bucketName = 'medical-reports'
    const bucketExists = buckets.find(b => b.name === bucketName)

    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'text/plain']
      })
      if (createError) throw createError
      console.log('  ✅ Created "medical-reports" bucket')
    } else {
      console.log('  ℹ️ "medical-reports" bucket already exists')
    }

    // ==========================================
    // 2. RLS Policies & Triggers
    // ==========================================
    console.log('\n🔒 Applying RLS Policies & Triggers...')
    
    // Helper to run raw SQL safely
    const runSql = async (name: string, sql: string) => {
      try {
        await prisma.$executeRawUnsafe(sql)
        console.log(`  ✅ ${name}`)
      } catch (e: any) {
        // Ignore "policy already exists" type errors to make script idempotent
        if (e.message.includes('already exists')) {
          console.log(`  ℹ️ ${name} (already exists)`)
        } else {
          console.error(`  ⚠️ Error running ${name}: ${e.message.split('\n')[0]}`)
        }
      }
    }

    // --- Enable RLS ---
    await runSql('Enable RLS on profiles', `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`)
    await runSql('Enable RLS on reports', `ALTER TABLE reports ENABLE ROW LEVEL SECURITY;`)
    await runSql('Enable RLS on audit_logs', `ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;`)

    // --- Profiles Policies ---
    // Cast auth.uid() to text since our IDs are text in Prisma schema
    await runSql('Policy: view own profile', `
      DO $$ BEGIN
        CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid()::text = user_id);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)
    
    await runSql('Policy: update own profile', `
      DO $$ BEGIN
        CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid()::text = user_id);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)

    // --- Reports Policies ---
    await runSql('Policy: manage own reports', `
      DO $$ BEGIN
        CREATE POLICY "Users can manage own reports" ON reports FOR ALL USING (auth.uid()::text = user_id);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)

    // --- Audit Logs Policies ---
    await runSql('Policy: view own audit logs', `
      DO $$ BEGIN
        CREATE POLICY "Users can view own audit logs" ON audit_logs FOR SELECT USING (auth.uid()::text = user_id);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)

    // --- Auth Triggers ---
    // Handle new user signup -> automatically create profile
    await runSql('Function: handle_new_user', `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (user_id, name)
        VALUES (NEW.id::text, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `)

    await runSql('Trigger: on_auth_user_created', `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `)

    // --- Storage Policies ---
    // Note: These must be run on the 'storage.objects' table which is in the 'storage' schema
    // Prisma might have trouble accessing 'storage' schema by default unless permissions allow
    // But 'postgres' user usually has access.
    
    await runSql('Policy: storage upload', `
      DO $$ BEGIN
        CREATE POLICY "Users can upload own reports" ON storage.objects FOR INSERT WITH CHECK (
          bucket_id = 'medical-reports' AND auth.uid()::text = (storage.foldername(name))[1]
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)
    
    await runSql('Policy: storage select', `
      DO $$ BEGIN
        CREATE POLICY "Users can view own files" ON storage.objects FOR SELECT USING (
          bucket_id = 'medical-reports' AND auth.uid()::text = (storage.foldername(name))[1]
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)

    await runSql('Policy: storage delete', `
      DO $$ BEGIN
        CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE USING (
          bucket_id = 'medical-reports' AND auth.uid()::text = (storage.foldername(name))[1]
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)

    console.log('\n✅ Setup completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
