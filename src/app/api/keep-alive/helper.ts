import { SupabaseClient } from '@supabase/supabase-js'
import ky from 'ky'
import { keepAliveConfig as config } from './keep-alive-config'

export type QueryResponse = {
  successful: boolean
  message: string
}

type QueryResponseWithData = QueryResponse & {
  data: Record<string, unknown>[] | null
}

export class KeepAliveService {
  private static readonly defaultRandomStringLength = 12
  private static readonly alphabetOffset = 'a'.charCodeAt(0)

  static generateRandomString(length: number = KeepAliveService.defaultRandomStringLength) {
    let value = ''
    for (let index = 0; index < length; index += 1) {
      value += String.fromCharCode(KeepAliveService.alphabetOffset + Math.floor(Math.random() * 26))
    }
    return value
  }

  static async queryRandom(supabase: SupabaseClient, randomStringLength = KeepAliveService.defaultRandomStringLength): Promise<QueryResponse> {
    const currentRandomString = KeepAliveService.generateRandomString(randomStringLength)
    const { data, error } = await supabase.from(config.table).select('*').eq(config.column, currentRandomString)
    const messageInfo = `Results for retrieving\n'${currentRandomString}' from '${config.table}' at column '${config.column}'`
    if (error) return KeepAliveService.error(messageInfo, error.message)
    return { successful: true, message: `${messageInfo}: ${JSON.stringify(data)}` }
  }

  static async determineAction(supabase: SupabaseClient): Promise<QueryResponse> {
    const retrievalResults = await KeepAliveService.retrieveEntries(supabase)
    if (!retrievalResults.successful || retrievalResults.data == null) {
      return {
        successful: false,
        message: `Failed to retrieve entries from ${config.table}\n${retrievalResults.message}`,
      }
    }

    const retrievedEntries = retrievalResults.data
    if (retrievedEntries.length > config.sizeBeforeDeletions) {
      const entryToDelete = retrievedEntries.pop()
      const value = String(entryToDelete?.[config.column] ?? '')
      return KeepAliveService.deleteRandom(supabase, value)
    }

    const randomString = KeepAliveService.generateRandomString()
    return KeepAliveService.insertRandom(supabase, randomString)
  }

  static async fetchOtherEndpoints(): Promise<string[]> {
    if (config.otherEndpoints.length === 0) return []
    const checks = config.otherEndpoints.map(async (endpoint) => {
      try {
        const response = await ky.get(endpoint, { cache: 'no-store' })
        return `${endpoint} - ${response.status === 200 ? 'Passed' : 'Failed'}`
      } catch {
        return `${endpoint} - Failed`
      }
    })
    return Promise.all(checks)
  }

  private static async retrieveEntries(supabase: SupabaseClient): Promise<QueryResponseWithData> {
    const { data, error } = await supabase.from(config.table).select(config.column)
    const messageInfo = `Results for retrieving entries from '${config.table}' - '${config.column}' column`
    if (error) return { ...KeepAliveService.error(messageInfo, error.message), data: null }
    return { successful: true, message: `${messageInfo}: ${JSON.stringify(data)}`, data: (data as unknown as Record<string, unknown>[]) ?? [] }
  }

  private static async insertRandom(supabase: SupabaseClient, randomString: string): Promise<QueryResponse> {
    const payload = { [config.column]: randomString }
    const { data, error } = await supabase.from(config.table).upsert(payload).select()
    const messageInfo = `Results for upserting\n'${randomString}' from '${config.table}' at column '${config.column}'`
    if (error) return KeepAliveService.error(messageInfo, error.message)
    return { successful: true, message: `${messageInfo}: ${JSON.stringify(data)}` }
  }

  private static async deleteRandom(supabase: SupabaseClient, entryToDelete: string): Promise<QueryResponse> {
    const { error } = await supabase.from(config.table).delete().eq(config.column, entryToDelete)
    const messageInfo = `Results for deleting\n'${entryToDelete}' from '${config.table}' at column '${config.column}'`
    if (error) return KeepAliveService.error(messageInfo, error.message)
    return { successful: true, message: `${messageInfo}: success` }
  }

  private static error(messageInfo: string, errorMessage: string): QueryResponse {
    const message = `${messageInfo}: ${errorMessage}`
    if (config.consoleLogOnError) console.log(message)
    return { successful: false, message }
  }
}
