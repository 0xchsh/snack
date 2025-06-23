import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const client = await clerkClient();
    // Get the user and their email addresses
    const user = await client.users.getUser(userId);
    const existing = user.emailAddresses.find((ea: any) => ea.emailAddress.toLowerCase() === email.toLowerCase());

    if (existing) {
      return NextResponse.json({ success: true, message: 'Email already exists. If unverified, please check your inbox.' });
    }

    // Add the new email address (this triggers Clerk to send a verification email)
    await client.emailAddresses.createEmailAddress({ userId, emailAddress: email });

    return NextResponse.json({ success: true, message: 'Verification email sent! Please check your inbox to verify your new email.' });
  } catch (error: any) {
    console.error('Clerk error:', error);
    return NextResponse.json(
      { error: error?.errors?.[0]?.message || error.message || 'Failed to update email', details: error },
      { status: 422 }
    );
  }
} 