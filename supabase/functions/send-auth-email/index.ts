
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailRequest {
  to: string;
  token_hash: string;
  email_action_type: string;
  redirect_to?: string;
  site_url: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, token_hash, email_action_type, redirect_to, site_url }: AuthEmailRequest = await req.json();

    let subject = "";
    let html = "";
    
    const confirmationUrl = `${site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}${redirect_to ? `&redirect_to=${redirect_to}` : ''}`;

    switch (email_action_type) {
      case "signup":
        subject = "Confirm your HTMLScout account";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0A2342;">Welcome to HTMLScout!</h1>
            <p>Thank you for signing up. Please confirm your email address by clicking the button below:</p>
            <a href="${confirmationUrl}" style="display: inline-block; background-color: #E97528; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Confirm Email Address
            </a>
            <p>If you didn't create an account with HTMLScout, you can safely ignore this email.</p>
            <p>Best regards,<br>The HTMLScout Team</p>
          </div>
        `;
        break;
      case "recovery":
        subject = "Reset your HTMLScout password";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0A2342;">Reset Your Password</h1>
            <p>You requested to reset your password. Click the button below to set a new password:</p>
            <a href="${confirmationUrl}" style="display: inline-block; background-color: #E97528; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Reset Password
            </a>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            <p>Best regards,<br>The HTMLScout Team</p>
          </div>
        `;
        break;
      case "invite":
        subject = "You've been invited to HTMLScout";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0A2342;">You're Invited to HTMLScout!</h1>
            <p>You've been invited to join HTMLScout. Click the button below to accept the invitation:</p>
            <a href="${confirmationUrl}" style="display: inline-block; background-color: #E97528; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Accept Invitation
            </a>
            <p>Best regards,<br>The HTMLScout Team</p>
          </div>
        `;
        break;
      default:
        subject = "HTMLScout Account Verification";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0A2342;">Account Verification</h1>
            <p>Please verify your account by clicking the button below:</p>
            <a href="${confirmationUrl}" style="display: inline-block; background-color: #E97528; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Verify Account
            </a>
            <p>Best regards,<br>The HTMLScout Team</p>
          </div>
        `;
    }

    const emailResponse = await resend.emails.send({
      from: "HTMLScout <noreply@resend.dev>",
      to: [to],
      subject: subject,
      html: html,
    });

    console.log("Authentication email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-auth-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
