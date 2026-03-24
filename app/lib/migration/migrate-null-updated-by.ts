import { getConnection } from '../sql'

export async function migrateNullUpdatedBy(): Promise<{ updated: number; remaining: number }> {
  const pool = await getConnection()

  console.log('🔄 Migrating NULL updated_by values...')

  // Fill NULL updated_by with assigned_to as fallback
  const result = await pool.request().query(`
    UPDATE [Dev_Born].[dbo].[ticket]
    SET updated_by = assigned_to
    WHERE updated_by IS NULL
      AND assigned_to IS NOT NULL
      AND status != 'unsent'
  `)

  const updated = result.rowsAffected[0]

  // Check remaining NULLs
  const checkResult = await pool.request().query(`
    SELECT COUNT(*) as orphan_tickets
    FROM [Dev_Born].[dbo].[ticket]
    WHERE updated_by IS NULL
      AND status != 'unsent'
  `)

  const remaining = checkResult.recordset[0].orphan_tickets

  console.log(`✅ Updated ${updated} tickets`)
  console.log(`⚠️  ${remaining} tickets still have NULL updated_by (need manual attention)`)

  return { updated, remaining }
}
