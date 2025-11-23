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
    const { sourceJson, targetLocale } = await req.json();

    if (!sourceJson || !targetLocale) {
      return new Response(
        JSON.stringify({ error: "sourceJson and targetLocale are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // System prompt para tradução técnica
    const systemPrompt = `You are a professional translator specializing in dairy cattle genetics software.

CRITICAL RULES:
1. Preserve ALL technical terms (PTAs) EXACTLY as they are - DO NOT translate them (e.g., TPI, NM$, HHP$, PTAF, PTAT, etc.)
2. Maintain JSON structure perfectly - output must be valid JSON
3. Translate only natural language text, not keys or technical codes
4. Use professional, clear language appropriate for technical users
5. Preserve all special characters, formatting, and punctuation

Technical terms to NEVER translate:
- All PTA abbreviations (TPI, NM$, CM$, FM$, GM$, HHP$, PTAF, PTAP, PTAM, PTAT, etc.)
- NAAB codes
- Technical metrics (SCS, DPR, PL, CCR, HCR, etc.)

Example:
Input: "nexus2.title": "Nexus 2: Predição por Pedigree"
Output: "nexus2.title": "Nexus 2: Pedigree Prediction"

Input: "nexus2.results.trait": "PTA"
Output: "nexus2.results.trait": "PTA" (NO CHANGE)`;

    const userPrompt = `Translate the following JSON from Portuguese (pt-BR) to ${targetLocale}.

Source JSON:
${JSON.stringify(sourceJson, null, 2)}

Remember:
- Keep all PTA names and technical abbreviations UNCHANGED
- Preserve JSON structure exactly
- Only translate natural language descriptions and labels
- Output ONLY the translated JSON, no explanations`;

    console.log("Calling Lovable AI Gateway for translation...");

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
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
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
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI Gateway returned ${response.status}: ${errorText}`);
    }

    const aiResponse = await response.json();
    const translatedText = aiResponse.choices[0]?.message?.content;

    if (!translatedText) {
      throw new Error("No translation received from AI");
    }

    // Parse the translated JSON
    let translatedJson;
    try {
      // Remove markdown code blocks if present
      const cleanedText = translatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      translatedJson = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", translatedText);
      throw new Error("AI returned invalid JSON: " + parseError.message);
    }

    console.log("Translation completed successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        translatedJson,
        sourceKeyCount: Object.keys(sourceJson).length,
        targetKeyCount: Object.keys(translatedJson).length
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Translation failed",
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});