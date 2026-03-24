import { getConnection } from '../sql'

export interface PreMigrationCheckResult {
  total_tickets: number
  tickets_with_updated_by: number
  tickets_without_updated_by: number
  can_proceed: boolean
}

export async function runPreMigrationCheck(): Promise<PreMigrationCheckResult> {
  const pool = await getConnection()

  const result = await pool.request().query(`
    SELECT
      COUNT(*) as total_tickets,
      COUNT(updated_by) as tickets_with_updated_by,
      COUNT(*) - COUNT(updated_by) as tickets_without_updated_by
    FROM [Dev_Born].[dbo].[ticket]
    WHERE status != 'unsent'
  `)

  const row = result.recordset[0]
  const tickets_without_updated_by = row.tickets_without_updated_by

  return {
    total_tickets: row.total_tickets,
    tickets_with_updated_by: row.tickets_with_updated_by,
    tickets_without_updated_by: tickets_without_updated_by,
    can_proceed: tickets_without_updated_by === 0
  }
}
