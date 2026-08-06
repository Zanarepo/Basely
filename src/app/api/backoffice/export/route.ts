import { requireStaffWriteAccess } from '@/lib/backoffice/auth'
import { compileOrganizationDataExport } from '@/lib/compliance/export-service'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    // For now, only staff can trigger exports via backoffice
    await requireStaffWriteAccess()

    const url = new URL(req.url)
    const organizationId = url.searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
    }

    const exportResult = await compileOrganizationDataExport(organizationId)

    if (!exportResult.success) {
      return NextResponse.json({ error: exportResult.error }, { status: 500 })
    }

    // Return as a downloadable JSON file
    return new NextResponse(JSON.stringify(exportResult.data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="tenant_export_${organizationId}_${new Date().toISOString().split('T')[0]}.json"`
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
}
