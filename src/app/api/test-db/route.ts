import { NextResponse } from 'next/server';

export async function GET() {
  // Temporarily disabled during migration
  return NextResponse.json({ error: 'Not available during migration' }, { status: 503 });
}