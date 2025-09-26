import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
  employee_id: string;
  company_name: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Welcome email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, employee_id, company_name }: WelcomeEmailRequest = await req.json();
    
    console.log(`Sending welcome email to ${email} for employee ${employee_id}`);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not found in environment");
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${company_name} HR <onboarding@resend.dev>`,
        to: [email],
        subject: `Welcome to ${company_name}! Your Employee Account is Ready`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h1 style="color: #333; margin: 0;">Welcome to ${company_name}!</h1>
            </div>
            
            <div style="padding: 20px 0;">
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Dear ${name},
              </p>
              
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                We're excited to welcome you to the ${company_name} team! Your employee account has been created with the following details:
              </p>
              
              <div style="background-color: #e9ecef; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 5px 0; color: #333;"><strong>Employee ID:</strong> ${employee_id}</p>
                <p style="margin: 5px 0; color: #333;"><strong>Email:</strong> ${email}</p>
              </div>
              
              <h2 style="color: #333; font-size: 18px; margin-top: 30px;">Next Steps:</h2>
              <ol style="color: #333; line-height: 1.8;">
                <li>Check your email for onboarding tasks and instructions</li>
                <li>Complete your employee profile when you receive access</li>
                <li>Review and complete any required documentation</li>
                <li>Attend your scheduled orientation sessions</li>
              </ol>
              
              <p style="font-size: 16px; color: #333; line-height: 1.6; margin-top: 30px;">
                Our HR team will be in touch soon with additional details about your first day and onboarding process.
              </p>
              
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                If you have any questions, please don't hesitate to reach out to our HR department.
              </p>
              
              <p style="font-size: 16px; color: #333; line-height: 1.6; margin-top: 30px;">
                Welcome aboard!<br>
                <strong>The ${company_name} HR Team</strong>
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${emailResponse.status} ${errorData}`);
    }

    const result = await emailResponse.json();
    console.log("Welcome email sent successfully:", result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Welcome email sent successfully",
        emailId: result.id 
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-employee-welcome function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to send welcome email"
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);