import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        const { csvData } = await req.json()

        // Parse CSV (assuming it's already parsed as JSON array)
        const leads = csvData.map((row: any) => {
            // Helper to parse boolean
            const parseBool = (val: string | boolean) => {
                if (typeof val === 'boolean') return val
                return val?.toLowerCase() === 'yes' || val?.toLowerCase() === 'true'
            }

            // Helper to parse number
            const parseNum = (val: string | number) => {
                if (typeof val === 'number') return val
                const num = parseFloat(val?.replace(/,/g, '') || '0')
                return isNaN(num) ? null : num
            }

            const getBalanceKeys = (record: Record<string, unknown>) => {
                return Object.keys(record).filter((key) => {
                    const normalized = key.toLowerCase()
                    return normalized.includes('balance') && !normalized.includes('dop')
                })
            }

            // Helper to parse date
            const parseDate = (val: string) => {
                if (!val || val === '-') return null
                try {
                    const date = new Date(val)
                    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0]
                } catch {
                    return null
                }
            }

            const balanceKeys = getBalanceKeys(row)
            const primaryBalanceKey = balanceKeys[0]
            const secondaryBalanceKey = balanceKeys[1]

            return {
                record_id: row['Record ID'] || null,
                full_name: row['Record'] || 'Unknown',
                email: row['Parent Record > Email addresses'] || null,
                phone: row['Parent Record > Phone numbers'] || null,
                instagram: row['Parent Record > Instagram'] || null,
                company_name: row['Company name'] === '-' ? null : row['Company name'],
                job_title: row['Parent Record > Job title'] || null,
                country: row['Parent Record > Primary location > Country'] || null,
                city: row['Parent Record > Primary location > City'] || null,
                description: row['Parent Record > Description'] || null,
                priority: row['Priority '] || 'COLD',
                discovery_call_date: parseDate(row['Discovery Call Date']),
                offering_type: row['Offering Type '] || null,
                session_type: row['Session Type'] || null,
                payment_amount: parseNum(row['Payment ']),
                seats: parseInt(row['Seats']) || 1,
                balance: parseNum(primaryBalanceKey ? row[primaryBalanceKey] : row['Balance ']),
                balance_2: secondaryBalanceKey ? parseNum(row[secondaryBalanceKey]) : null,
                coupon_percent: parseInt(row['Coupon %']) || null,
                coupon_code: row['Coupon Code'] === '-' ? null : row['Coupon Code'],
                paid_deposit: parseBool(row['Paid Desposit']),
                amount_paid: parseNum(row['Amount Paid']),
                amount_paid_2: parseNum(row['Amount Paid 2']),
                date_of_payment: parseDate(row['DOP']),
                date_of_payment_2: parseDate(row['DOP 2']),
                date_of_payment_3: parseDate(row['DOP 3']),
                payment_plan: row['Payment Plan'] || null,
                paid_full: parseBool(row['Paid Full']),
                balance_dop: parseDate(row['Balance DOP']),
                day_slot: row['Day Slot'] || null,
                time_slot: row['Time Slot'] || null,
                start_date: parseDate(row['START DATE']),
                end_date: parseDate(row['END DATE']),
                sessions_done: parseInt(row['Sessions Done']) || 0,
                booked_support: row['Booked Support'] || null,
                support_date_booked: parseDate(row['Support Date Booked']),
                notes: row['Notes'] || null,
            }
        })

        // Upsert leads (update if record_id exists, insert otherwise)
        const { data, error } = await supabase
            .from('leads')
            .upsert(leads, {
                onConflict: 'record_id',
                ignoreDuplicates: false
            })
            .select()

        if (error) {
            console.error('Import error:', error)
            return new Response(JSON.stringify({ error: error.message }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        return new Response(JSON.stringify({
            success: true,
            imported: data?.length || 0,
            message: `Successfully imported ${data?.length || 0} leads`
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('Server error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
