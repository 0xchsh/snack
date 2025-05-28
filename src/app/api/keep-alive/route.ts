import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Simple database query to keep the connection alive
    const result = await prisma.$queryRaw`SELECT 1 as healthy`;
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection healthy',
      timestamp: new Date().toISOString(),
      result
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