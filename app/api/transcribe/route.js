import { supabase, supabaseAdmin } from "@/app/utils/supabase";

export async function POST(request) {
  try {
    const { audioBase64, title, audioUrl } = await request.json();
    
    // Get user ID from the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Transcribe audio using the new API endpoint
    const transcribeResponse = await fetch("https://api.craft4free.online/transcribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_base64: audioBase64
      }),
    });

    if (!transcribeResponse.ok) {
      const errorText = await transcribeResponse.text();
      console.error('Transcription API error:', errorText);
      return Response.json({ error: 'Transcription failed' }, { status: transcribeResponse.status });
    }

    const result = await transcribeResponse.json();
    
    // Extract transcript from the result and structure it properly for JSONB storage
    const transcriptText = result.transcript || result.text || '';
    
    // Create a structured transcript object for JSONB storage
    const transcript = {
      text: transcriptText,
      raw_response: result,
      timestamp: new Date().toISOString(),
      confidence: result.confidence || null,
      segments: result.segments || null,
      language: result.language || null
    };

    // Store in Supabase recordings table using service role key
    const { data: recording, error: insertError } = await supabaseAdmin
      .from('recordings')
      .insert({
        audio_url: audioUrl,
        title: title,
        user_id: user.id,
        transcript: transcript
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return Response.json({ error: 'Failed to save recording' }, { status: 500 });
    }

    return Response.json({
      success: true,
      recording: recording,
      transcript: transcript
    });
    
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
