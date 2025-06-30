import { NextRequest, NextResponse } from 'next/server';
import { createServerAuth } from "@/lib/auth-server"
import { createServerSupabaseClient } from "@/lib/auth-server"

export async function PATCH(request: NextRequest) {
  try {
    const serverAuth = createServerAuth();
    const user = await serverAuth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if email is the same as current
    if (email === user.email) {
      return NextResponse.json({ success: true, message: 'Email is already current' });
    }

    const supabase = createServerSupabaseClient();
    
    // Update email in Supabase auth
    const { error: authError } = await supabase.auth.updateUser({
      email: email
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Failed to update email' },
        { status: 422 }
      );
    }

    // Update email in users table
    const { error: dbError } = await supabase
      .from('users')
      .update({ email })
      .eq('id', user.id);

    if (dbError) {
      console.error('Database update error:', dbError);
      return NextResponse.json(
        { error: 'Failed to update email in database' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email updated successfully! Please check your inbox to confirm the new email.' 
    });
  } catch (error: any) {
    console.error('Email update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update email' },
      { status: 500 }
    );
  }
} 