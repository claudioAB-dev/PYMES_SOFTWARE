import { createServerClient } from '@supabase/ssr'

/**
 * Returns the Supabase Auth admin client using the SERVICE ROLE key.
 * ONLY call this from Server Actions or Route Handlers — never from the client.
 *
 * Uses `createServerClient` from @supabase/ssr with no-op cookies,
 * initialised with the service_role key which unlocks auth.admin.* methods.
 * The `any` cast below is intentional: @supabase/ssr's type definitions don't
 * expose the admin namespace in their typings, but the runtime object returned
 * by createServerClient does include it when the service role key is used.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAdminAuthClient(): any {
    const client = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll: () => [],
                setAll: () => { },
            },
        }
    )
    return client.auth
}
