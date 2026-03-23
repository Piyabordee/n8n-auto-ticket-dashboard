import { migrateNullUpdatedBy } from './migrate-null-updated-by'

async function main() {
  console.log('🔄 Running data migration...')
  const result = await migrateNullUpdatedBy()

  if (result.remaining > 0) {
    console.log('⚠️  Some tickets still need manual attention')
    process.exit(1)
  } else {
    console.log('✅ Migration complete!')
    process.exit(0)
  }
}

main().catch(console.error)
