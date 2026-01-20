import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing Auth Trigger...')
  try {
    // Redefine the function to explicitly generate an ID using gen_random_uuid()
    // This ensures that even if the default constraint is missing on the table, the insert succeeds.
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, user_id, name)
        VALUES (gen_random_uuid()::text, NEW.id::text, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `)
    console.log('✅ Trigger function updated to explicitly generate UUIDs.')
  } catch (e: any) {
    console.error('❌ Failed:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
