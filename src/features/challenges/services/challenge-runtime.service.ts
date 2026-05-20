import { httpClient } from '@/lib/http/client'

export type ServiceAction = 'up' | 'restart' | 'extend'

export class ChallengeRuntimeService {
  static async inspect(service: string) {
    return httpClient.get('nxctl', { searchParams: { action: 'inspect', name: service } }).json<any>()
  }

  static async mutate(service: string, action: ServiceAction) {
    return httpClient.post('nxctl', { json: { action, name: service } }).json<any>()
  }
}
