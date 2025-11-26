import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const groqApiKey = Deno.env.get("GROQ_API_KEY");

    if (!groqApiKey) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get tasks that are due and not yet notified
    const now = new Date().toISOString();
    const { data: dueTasks, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .lte("scheduled_time", now)
      .eq("notified", false)
      .eq("status", "pending");

    if (fetchError) {
      console.error("Error fetching tasks:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${dueTasks?.length || 0} tasks to process`);

    if (!dueTasks || dueTasks.length === 0) {
      return new Response(
        JSON.stringify({ message: "No tasks to process", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processed = 0;
    for (const task of dueTasks) {
      try {
        // Enhance task with Groq
        const enhancePrompt = `You are a helpful task assistant. Enhance the following task to make it more actionable and motivating. Keep it concise (2-3 sentences max).

Task: ${task.task}
${task.notes ? `Notes: ${task.notes}` : ''}

Provide an enhanced, motivating version of this task:`;

        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: "You are a helpful task assistant that enhances task descriptions to be more actionable and motivating." },
              { role: "user", content: enhancePrompt }
            ],
            temperature: 0.7,
            max_tokens: 200
          }),
        });

        if (!groqResponse.ok) {
          console.error("Groq API error:", await groqResponse.text());
          continue;
        }

        const groqData = await groqResponse.json();
        const enhancedText = groqData.choices?.[0]?.message?.content || task.task;

        console.log(`Enhanced task ${task.id}: ${enhancedText}`);

        // Send notification (Web Push would go here, for now just log)
        console.log(`Sending notification for task: ${task.task}`);
        
        // Update task as notified
        const { error: updateError } = await supabase
          .from("tasks")
          .update({ notified: true, notes: enhancedText })
          .eq("id", task.id);

        if (updateError) {
          console.error(`Error updating task ${task.id}:`, updateError);
        } else {
          processed++;
        }
      } catch (taskError) {
        console.error(`Error processing task ${task.id}:`, taskError);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Processed ${processed} tasks`,
        processed,
        total: dueTasks.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in enhance-and-notify function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
