import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Resource: Fixing database schema...')
  
  try {
    // Drop the table that has the invalid cross-schema foreign key
    console.log('Dropping "prescriptions" table...')
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "prescriptions" CASCADE;`)
    console.log('Successfully dropped "prescriptions".')
    
  } catch (error) {
    console.error('Error fixing schema:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
