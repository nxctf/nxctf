import { NextResponse } from 'next/server'
import { NxctlService } from './nxctl.service'
import { nxctlGetActionSchema, nxctlInspectQuerySchema, nxctlPostBodySchema } from './nxctl.schemas'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  const parsedAction = nxctlGetActionSchema.safeParse(action)
  if (!parsedAction.success) {
    return NextResponse.json({ error: 'Invalid GET action' }, { status: 400 })
  }

  if (parsedAction.data === 'inspect') {
    const parsedQuery = nxctlInspectQuerySchema.safeParse({
      action: parsedAction.data,
      name: searchParams.get('name'),
    })
    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Missing service name' }, { status: 400 })
    }
    const result = await NxctlService.inspect(parsedQuery.data.name)
    return NextResponse.json(result.data, { status: result.status })
  }

  const result = await NxctlService.status()
  return NextResponse.json(result.data, { status: result.status })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsedBody = nxctlPostBodySchema.safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid action or name' }, { status: 400 })
    }
    const result = await NxctlService.runAction(parsedBody.data.action, parsedBody.data.name)
    return NextResponse.json(result.data, { status: result.status })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown server error' }, { status: 500 })
  }
}
