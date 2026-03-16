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
          id, message_id, status, assigned_to, assigned_date,
          intent, category, sub_category, branch_name, branch_company,
          subject, clean_text, raw_text, email_body, chatname,
          fromuser, userid, groupid, created_date, created_by,
          updated_date, updated_by, close_cause, close_reason, close_time_minute
        FROM Dev_Born.dbo.ticket
        WHERE message_id = @message_id
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
