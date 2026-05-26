import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const url = 'https://gzzeywmbehzbassweudb.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6emV5d21iZWh6YmFzc3dldWRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzYyODUsImV4cCI6MjA4NTk1MjI4NX0.lnVHSOdRVOVXmjQG9mIyh6UOAeDdY8Q68vYcJvZannc'

describe('Chat Feature Integration / E2E', () => {
  let supabase: any
  let user: any

  beforeAll(async () => {
    supabase = createClient(url, anonKey)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@zkandar.com',
      password: 'password123'
    })
    if (!error) {
      user = data.user
    }
  })

  it('successfully authenticates the test user', () => {
    expect(user).toBeDefined()
    expect(user.email).toBe('admin@zkandar.com')
  })

  it('executes chat room retrieval without infinite RLS recursion', async () => {
    const { data, error } = await supabase
      .from('chat_room_members')
      .select('room_id')
      .eq('user_id', user.id)

    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
  })

  it('retrieves detailed room information successfully', async () => {
    const { data: memberRooms } = await supabase
      .from('chat_room_members')
      .select('room_id')
      .eq('user_id', user.id)

    const roomIds = (memberRooms ?? []).map((r: any) => r.room_id)
    if (roomIds.length > 0) {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          members:chat_room_members(
            *,
            user:users(id, full_name, email, role)
          )
        `)
        .in('id', roomIds)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.length).toBeGreaterThan(0)
    }
  })
})
