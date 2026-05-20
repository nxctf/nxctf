import ky from 'ky'
import { NXCTL_API_TOKEN, NXCTL_API_URL } from '@/secret'
import { nxctlActionSchema } from './nxctl.schemas'

const apiUrl = NXCTL_API_URL.replace(/\/$/, '')
const apiToken = NXCTL_API_TOKEN

type SafeFetchResult = {
  status: number
  data: unknown
}

export class NxctlService {
  private static headers() {
    return { 'X-CTFC-Token': apiToken }
  }

  private static async safeRequest(path: string, options?: { method?: 'GET' | 'POST' }) : Promise<SafeFetchResult> {
    try {
      const response = await ky(`${apiUrl}${path}`, {
        method: options?.method ?? 'GET',
        headers: NxctlService.headers(),
        throwHttpErrors: false,
      })

      const text = await response.text()
      try {
        return { status: response.status, data: JSON.parse(text) }
      } catch {
        return { status: response.status, data: { raw: text || null } }
      }
    } catch (error: any) {
      return { status: 500, data: { error: error?.message || 'Unknown fetch error' } }
    }
  }

  static inspect(name: string) {
    return NxctlService.safeRequest(`/inspect/${name}`)
  }

  static status() {
    return NxctlService.safeRequest('/status')
  }

  static runAction(action: string, name: string) {
    const parsed = nxctlActionSchema.parse(action)
    return NxctlService.safeRequest(`/${parsed}/${name}`, { method: 'POST' })
  }
}

