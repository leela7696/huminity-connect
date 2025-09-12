import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get the request body
    const { 
      email, 
      full_name, 
      role, 
      employee_id, 
      job_title, 
      department, 
      hire_date, 
      phone, 
      address, 
      date_of_birth, 
      work_location, 
      employment_type, 
      salary, 
      benefits_eligible, 
      manager_id 
    } = await req.json()

    // Validate required fields
    if (!email || !full_name || !employee_id || !job_title || !department || !hire_date) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already exists
    let authData
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })
    
    const userExists = existingUser?.users?.find(user => user.email === email)
    
    if (userExists) {
      // Use existing user
      authData = { user: userExists }
    } else {
      // Create new user account
      const { data: newUserData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: 'TempPassword123!', // Temporary password
        email_confirm: true,
        user_metadata: {
          full_name: full_name,
          role: role || 'employee'
        }
      })

      if (authError) {
        console.error('Auth error:', authError)
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      authData = newUserData
    }

    // Update the profile that was created by the trigger
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: full_name,
        department: department,
        position: job_title,
        phone: phone,
        address: address,
        date_of_birth: date_of_birth || null,
        role: role || 'employee'
      })
      .eq('user_id', authData.user.id)

    if (profileError) {
      console.error('Profile error:', profileError)
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the profile ID
    const { data: profileData, error: profileFetchError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', authData.user.id)
      .single()

    if (profileFetchError) {
      console.error('Profile fetch error:', profileFetchError)
      return new Response(
        JSON.stringify({ error: profileFetchError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create employee record
    const { data: employeeData, error: employeeError } = await supabaseAdmin
      .from('employees')
      .insert({
        employee_id: employee_id,
        profile_id: profileData.id,
        job_title: job_title,
        hire_date: hire_date,
        salary: salary ? parseFloat(salary) : null,
        manager_id: manager_id || null,
        work_location: work_location,
        employment_type: employment_type || 'full-time',
        benefits_eligible: benefits_eligible !== false,
      })
      .select()
      .single()

    if (employeeError) {
      console.error('Employee error:', employeeError)
      return new Response(
        JSON.stringify({ error: employeeError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: authData.user,
        employee: employeeData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})