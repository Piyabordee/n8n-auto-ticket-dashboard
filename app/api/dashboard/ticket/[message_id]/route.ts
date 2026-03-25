import { NextRequest, NextResponse } from 'next/server'
import { getConnection } from '../../../../lib/sql'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ message_id: string }> }
) {
  try {
    const { message_id } = await params
    const pool = await getConnection()
    const result = await pool
      .request()
      .input('message_id', message_id)
      .query(`
        SELECT
          t.id, t.message_id, t.status, tm.fromUser AS updated_by, t.assigned_date,
          t.intent, t.category, t.sub_category, t.branch_name, t.branch_company,
          t.subject, t.clean_text, t.raw_text, t.email_body, t.chatname,
          t.fromuser, t.userid, t.groupid, t.created_date, t.created_by,
          t.updated_date, t.close_cause, t.close_reason, t.close_time_minute
        FROM Dev_Born.dbo.ticket t
        INNER JOIN [Dev_Born].[dbo].[it_team] tm ON t.updated_by = tm.userId
        WHERE t.message_id = @message_id
          AND t.status != 'unsent'
          AND tm.active = 'Y'
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ ticket: null }, { status: 404 })
    }

    return NextResponse.json({ ticket: result.recordset[0] })
  } catch (error) {
    console.error('Error fetching ticket detail:', error)
    return NextResponse.json(
      { ticket: null, error: 'Failed to fetch ticket detail' },
      { status: 500 }
    )
  }
}
