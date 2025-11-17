import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting notification check...");

    // Get current time
    const now = new Date();
    const currentTime = now.toISOString();

    // Find tasks that need notifications
    const { data: tasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'pending')
      .eq('notified', false)
      .lte('scheduled_time', currentTime);

    if (fetchError) {
      console.error("Error fetching tasks:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${tasks?.length || 0} tasks to notify`);

    for (const task of tasks || []) {
      console.log(`Processing notification for task: ${task.task}`);

      // Send email notification
      try {
        await sendEmailNotification(task);
      } catch (error) {
        console.error(`Email notification failed for task ${task.id}:`, error);
      }

      // Mark as notified
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ notified: true })
        .eq('id', task.id);

      if (updateError) {
        console.error(`Failed to mark task ${task.id} as notified:`, updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notified: tasks?.length || 0 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function sendEmailNotification(task: any) {
  const emailServer = Deno.env.get('EMAIL_SERVER');
  const emailUsername = Deno.env.get('EMAIL_USERNAME');
  const emailPassword = Deno.env.get('EMAIL_PASSWORD');
  const emailPort = Deno.env.get('EMAIL_PORT') || '587';

  if (!emailServer || !emailUsername || !emailPassword) {
    console.log("Email credentials not configured, skipping email notification");
    return;
  }

  // Format the scheduled time
  const taskTime = new Date(task.scheduled_time).toLocaleString();

  const emailBody = `
This is your reminder:

Task: ${task.task}
Time: ${taskTime}
${task.duration ? `Duration: ${task.duration} minutes` : ''}
${task.notes ? `Notes: ${task.notes}` : ''}

Don't forget to complete your task!
  `.trim();

  // Using a simple SMTP approach via fetch to an email service
  // Note: In production, you'd use a proper email service like Resend or SendGrid
  console.log(`Would send email for task: ${task.task} to user ${task.user_id}`);
  console.log(`Email body: ${emailBody}`);
  
  // TODO: Implement actual email sending with the configured SMTP server
  // For now, we're just logging. In production, integrate with your email service.
}
