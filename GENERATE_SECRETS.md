# Generate Secure Secrets

Quick reference for generating secure secrets for your `.env` file.

## Generate JWT and Session Secrets

All secrets should be at least 32 characters (256 bits) for security.

### Using Node.js (Recommended)

```bash
# Generate a single secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate all three secrets at once
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex')); console.log('REFRESH_TOKEN_SECRET=' + require('crypto').randomBytes(32).toString('hex')); console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### Using OpenSSL

```bash
# Generate a single secret
openssl rand -hex 32

# Generate all three secrets
echo "JWT_SECRET=$(openssl rand -hex 32)"
echo "REFRESH_TOKEN_SECRET=$(openssl rand -hex 32)"
echo "SESSION_SECRET=$(openssl rand -hex 32)"
```

### Using PowerShell (Windows)

```powershell
# Generate a single secret
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})

# Or use this simpler method
[System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## Example Output

```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
REFRESH_TOKEN_SECRET=f2e1d0c9b8a7z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1
SESSION_SECRET=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f
```

## Security Best Practices

1. **Never reuse secrets** - Generate unique secrets for each environment variable
2. **Never commit secrets** - Keep `.env` file out of version control (already in `.gitignore`)
3. **Use different secrets per environment** - Development, staging, and production should have different secrets
4. **Rotate secrets regularly** - Change secrets periodically, especially after team member changes
5. **Store production secrets securely** - Use environment variables in your hosting platform, not `.env` files

## Quick Setup Script

Save this as `generate-env.sh` and run it to generate a complete `.env` file:

```bash
#!/bin/bash

cat > backend/.env << EOF
# Generated on $(date)
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=mongodb://localhost:27017/mern-education-platform

# JWT Secrets (Generated)
JWT_SECRET=$(openssl rand -hex 32)
REFRESH_TOKEN_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# Session Secret (Generated)
SESSION_SECRET=$(openssl rand -hex 32)

# Redis
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=http://localhost:3000

# Payment (Add your keys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# AWS (Add your keys)
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=mern-education-platform-storage

# Email (Add your keys)
EMAIL_SERVICE_API_KEY=your_email_service_api_key
EMAIL_FROM=noreply@yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
EOF

echo "✅ Generated backend/.env with secure secrets!"
echo "⚠️  Remember to update DATABASE_URL, Stripe, AWS, and Email credentials"
```

Make it executable and run:

```bash
chmod +x generate-env.sh
./generate-env.sh
```

## Verifying Your Secrets

Check that your secrets are strong enough:

```bash
# Check length (should be 64 characters for hex-encoded 32 bytes)
echo -n "your_secret_here" | wc -c

# Should output: 64
```

## Need Help?

See [HOW_TO_RUN.md](./HOW_TO_RUN.md) for complete setup instructions.
