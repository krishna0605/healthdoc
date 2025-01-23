import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  console.log('🕵️‍♀️ Debugging Database...')
  try {
    // 1. Check if we can connect
    console.log('  Testing connection...')
    const count = await prisma.profile.count()
    console.log(`  ✅ Connected! Current profiles: ${count}`)

    // 2. Try to insert a dummy profile (replicating the Trigger logic)
    console.log('  Attempting manual INSERT like the Trigger...')
    const testId = `debug-${Date.now()}`
    
    // Using executeRaw to match Trigger SQL exactly
    await prisma.$executeRawUnsafe(`
      INSERT INTO public.profiles (id, user_id, name)
      VALUES (gen_random_uuid()::text, '${testId}', 'Debug User');
    `)
    console.log('  ✅ Manual INSERT succeeded!')
    
    // Cleanup
    await prisma.$executeRawUnsafe(`DELETE FROM public.profiles WHERE user_id = '${testId}';`)
    console.log('  ✅ Cleanup completed.')

  } catch (e: any) {
    console.error('  ❌ DEBUG FAILED:', e)
    console.log('\n  ⚠️ Possible Causes:')
    if (e.message.includes('permission denied')) console.log('     - RLS Policy blocking insert?')
    if (e.message.includes('gen_random_uuid')) console.log('     - pgcrypto extension missing?')
    if (e.message.includes('relation "public.profiles" does not exist')) console.log('     - Table missing!')
  } finally {
    await prisma.$disconnect()
  }
}

main()
