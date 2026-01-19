-- Extension authentication tokens table
-- Stores access and refresh tokens for the Chrome extension

CREATE TABLE IF NOT EXISTS extension_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL UNIQUE,
  refresh_token TEXT NOT NULL UNIQUE,
  access_token_expires_at TIMESTAMPTZ NOT NULL,
  refresh_token_expires_at TIMESTAMPTZ NOT NULL,
  device_name TEXT DEFAULT 'Chrome Extension',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- One-time auth codes for the OAuth-style flow
CREATE TABLE IF NOT EXISTS extension_auth_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  callback_url TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_extension_tokens_user_id ON extension_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_extension_tokens_access_token ON extension_tokens(access_token);
CREATE INDEX IF NOT EXISTS idx_extension_tokens_refresh_token ON extension_tokens(refresh_token);
CREATE INDEX IF NOT EXISTS idx_extension_auth_codes_code ON extension_auth_codes(code);
CREATE INDEX IF NOT EXISTS idx_extension_auth_codes_expires_at ON extension_auth_codes(expires_at);

-- RLS Policies
ALTER TABLE extension_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE extension_auth_codes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tokens
CREATE POLICY "Users can view own extension tokens"
  ON extension_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only delete their own tokens (for logout)
CREATE POLICY "Users can delete own extension tokens"
  ON extension_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can manage all tokens (for API routes)
CREATE POLICY "Service role manages extension tokens"
  ON extension_tokens FOR ALL
  USING (auth.role() = 'service_role');

-- Service role can manage auth codes
CREATE POLICY "Service role manages extension auth codes"
  ON extension_auth_codes FOR ALL
  USING (auth.role() = 'service_role');

-- Function to clean up expired tokens and codes
CREATE OR REPLACE FUNCTION cleanup_expired_extension_tokens()
RETURNS void AS $$
BEGIN
  -- Delete expired auth codes
  DELETE FROM extension_auth_codes
  WHERE expires_at < NOW();

  -- Delete expired and revoked tokens (keep for 30 days for audit)
  DELETE FROM extension_tokens
  WHERE (refresh_token_expires_at < NOW() - INTERVAL '30 days')
     OR (revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE extension_tokens IS 'Stores authentication tokens for the Snack Chrome extension';
COMMENT ON TABLE extension_auth_codes IS 'Temporary auth codes for OAuth-style extension authentication';
