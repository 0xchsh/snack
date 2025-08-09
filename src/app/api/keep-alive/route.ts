import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/client';

export async function GET() {
  try {
    const supabase = createClient();
    // Simple database query to keep the connection alive
    const { error } = await supabase.rpc('health_check'); // You may need to create a simple function in Supabase
    if (error) throw error;
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection healthy',
      timestamp: new Date().toISOString(),
      result: [{ healthy: 1 }]
    }, { status: 200 });
  } catch (error) {
    console.error('Keep-alive database query failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
} 