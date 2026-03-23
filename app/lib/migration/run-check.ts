import { runPreMigrationCheck } from './pre-migration-check'

async function main() {
  console.log('🔍 Running pre-migration check...')
  const result = await runPreMigrationCheck()

  console.log(`📊 Total tickets: ${result.total_tickets}`)
  console.log(`✅ Tickets with updated_by: ${result.tickets_with_updated_by}`)
  console.log(`⚠️  Tickets without updated_by: ${result.tickets_without_updated_by}`)

  if (result.can_proceed) {
    console.log('✅ Migration can proceed safely!')
    process.exit(0)
  } else {
    console.log('❌ CANNOT PROCEED: Found tickets without updated_by')
    console.log('   Run data migration script first (see Task 3)')
    process.exit(1)
  }
}

main().catch(console.error)
