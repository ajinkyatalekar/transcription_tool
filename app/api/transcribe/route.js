import AWS from "aws-sdk";
import { supabase, supabaseAdmin } from "@/app/utils/supabase";

export async function POST(request) {
  try {
    const { audioBase64, title } = await request.json();
    
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

    // Transcribe audio using AWS SageMaker
    const sagemakerRuntime = new AWS.SageMakerRuntime({
      region: process.env.NEXT_PUBLIC_AWS_REGION,
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    });

    const params = {
      EndpointName: process.env.NEXT_PUBLIC_SAGEMAKER_ENDPOINT_NAME,
      Body: Buffer.from(audioBase64, "base64"),
      ContentType: "audio/x-audio",
    };

    const response = await sagemakerRuntime.invokeEndpoint(params).promise();
    const result = JSON.parse(Buffer.from(response.Body).toString("utf8"));
    
    // Extract transcript from the result (adjust based on your SageMaker output format)
    const transcript = result.transcript || result.text || JSON.stringify(result);

    // Store in Supabase recordings table using service role key
    const { data: recording, error: insertError } = await supabaseAdmin
      .from('recordings')
      .insert({
        audio: Buffer.from(audioBase64, "base64"),
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
