import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing task extraction request:", text);

    const currentDate = new Date().toISOString();
    const todayDate = new Date().toISOString().split('T')[0];

    const systemPrompt = `You are an AI assistant that extracts tasks from natural language input. 
Extract all tasks and their exact times from the user's input.

IMPORTANT: Today's date is ${todayDate}. The current datetime is ${currentDate}.

Requirements:
1. Each task must have a "task" name (string).
2. Each task must have a "time" in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ).
3. If a task has duration, include "duration" in minutes (integer).
4. Include "notes" if there is extra information (string).
5. Ignore filler text, extract only valid tasks.
6. When user mentions times without dates (like "6am", "9pm", "noon"), assume they mean TODAY (${todayDate}).
7. If the time mentioned has already passed today, schedule it for today anyway (user will reschedule if needed).
8. Use ${currentDate} as the reference point for relative times.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_tasks",
              description: "Extract tasks with their scheduled times from natural language input",
              parameters: {
                type: "object",
                properties: {
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        task: {
                          type: "string",
                          description: "The task description"
                        },
                        time: {
                          type: "string",
                          description: "ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SSZ)"
                        },
                        duration: {
                          type: "integer",
                          description: "Duration in minutes (optional)"
                        },
                        notes: {
                          type: "string",
                          description: "Additional notes (optional)"
                        }
                      },
                      required: ["task", "time"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["tasks"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_tasks" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data));

    // Extract the function call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("No valid tool call response from AI");
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    console.log("Extracted tasks:", JSON.stringify(extractedData));

    return new Response(
      JSON.stringify(extractedData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in extract-tasks function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        tasks: []
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
