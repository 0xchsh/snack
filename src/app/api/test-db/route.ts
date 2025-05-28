import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 });
    }

    console.log('Testing database connection for user:', user.id);

    // Test the exact same query that's failing in the dashboard
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      include: {
        lists: {
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    return NextResponse.json({
      status: 'success',
      message: 'Database query successful',
      timestamp: new Date().toISOString(),
      user: {
        clerkId: user.id,
        dbUser: dbUser ? 'found' : 'not found',
        listsCount: dbUser?.lists?.length || 0
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Test database query failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Database query failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
} 