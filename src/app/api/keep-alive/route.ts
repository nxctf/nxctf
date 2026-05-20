import { supabase } from '@/lib/supabase/client'
import { keepAliveConfig as config } from './keep-alive-config'
import { KeepAliveService } from './helper'

export const dynamic = 'force-dynamic' // defaults to auto


export async function GET() {
  let responseMessage: string = ''
  let successfulResponses: boolean = true

  if (config?.disableRandomStringQuery != true) {
    const querySupabaseResponse = await KeepAliveService.queryRandom(supabase)

    successfulResponses = successfulResponses && querySupabaseResponse.successful
    responseMessage += querySupabaseResponse.message + '\n\n'
  }

  if (config?.allowInsertionAndDeletion == true) {
    const insertOrDeleteResults = await KeepAliveService.determineAction(supabase)

    successfulResponses = successfulResponses && insertOrDeleteResults.successful
    responseMessage += insertOrDeleteResults.message + '\n\n'
  }

  if (config?.otherEndpoints != null && config?.otherEndpoints.length > 0) {
    const fetchResults = await KeepAliveService.fetchOtherEndpoints()
    responseMessage += `\n\nOther Endpoint Results:\n${fetchResults.join('\n')}`
  }

  return new Response(responseMessage, {
    status: (successfulResponses == true) ? 200 : 400
  })
}
