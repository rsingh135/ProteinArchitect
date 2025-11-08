# 🔒 Security Guidelines

## API Key Management

### Never Commit Secrets

**DO NOT** commit the following to git:
- `.env` files
- API keys in code
- AWS credentials
- SSH keys
- Any file containing secrets

### Checking for Leaked Secrets

Before committing, check for secrets:

```bash
# Check if .env is tracked
git ls-files | grep .env

# Check for API keys in code
grep -r "api_key.*=" --include="*.py" --include="*.js" | grep -v ".env.example"
grep -r "GEMINI_API_KEY" --include="*.py" --include="*.js" | grep -v ".env.example"
grep -r "OPENAI_API_KEY" --include="*.py" --include="*.js" | grep -v ".env.example"

# Check for AWS credentials
grep -r "AWS_SECRET" --include="*.py" --include="*.js" | grep -v ".env.example"
```

### If You Accidentally Commit Secrets

1. **Immediately rotate the keys**:
   - Generate new API keys
   - Update `.env` file
   - Revoke old keys

2. **Remove from git history**:
   ```bash
   # Remove file from git history
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch backend/.env" \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push (WARNING: This rewrites history)
   git push origin --force --all
   ```

3. **Add to .gitignore** (if not already):
   ```bash
   echo ".env" >> .gitignore
   git add .gitignore
   git commit -m "Add .env to gitignore"
   ```

## Best Practices

### 1. Use Environment Variables

✅ **GOOD**:
```python
import os
api_key = os.getenv("GEMINI_API_KEY")
```

❌ **BAD**:
```python
api_key = "AIzaSyD..."  # Never hardcode!
```

### 2. Use .env.example Files

✅ **GOOD**:
```bash
# .env.example (commit this)
GEMINI_API_KEY=your_gemini_api_key_here

# .env (don't commit this)
GEMINI_API_KEY=AIzaSyD...actual_key...
```

### 3. Verify .gitignore

Always verify sensitive files are in `.gitignore`:

```bash
# Check .gitignore includes .env
cat .gitignore | grep -E "^\\.env$"

# Verify .env is not tracked
git status --ignored | grep .env
```

### 4. Use Different Keys for Environments

- **Development**: Use test/sandbox keys
- **Production**: Use production keys
- **Never** use production keys in development

### 5. Rotate Keys Regularly

- Rotate API keys every 90 days
- Rotate AWS credentials every 180 days
- Immediately rotate if keys are leaked

## Files That Should Never Be Committed

- `.env` and all `.env.*` files (except `.env.example`)
- `*.key`, `*.pem` (private keys)
- `credentials.json`, `secrets.json`
- `.aws/` directory
- `id_rsa`, `id_ed25519` (SSH keys)
- Any file containing "secret", "key", "credential" in name

## Pre-commit Checklist

Before committing, verify:

```bash
# 1. Check for .env files
git status | grep .env
# Should return nothing

# 2. Check for API keys in code
grep -r "api.*key.*=" --include="*.py" --include="*.js" | grep -v ".env.example" | grep -v "os.getenv"
# Should return nothing

# 3. Verify .gitignore is up to date
cat .gitignore | grep -E "^\\.env$"
# Should return: .env

# 4. Check git status
git status
# Review all changes before committing
```

## Git Hooks (Optional)

Create a pre-commit hook to check for secrets:

```bash
# .git/hooks/pre-commit
#!/bin/bash

# Check for .env files
if git diff --cached --name-only | grep -E "\.env$"; then
    echo "ERROR: .env file detected in commit!"
    echo "Please remove .env from staging area."
    exit 1
fi

# Check for hardcoded API keys
if git diff --cached | grep -E "(api_key|API_KEY|secret|SECRET)\s*=\s*[\"'][^\"']{10,}"; then
    echo "WARNING: Possible API key detected in code!"
    echo "Please use environment variables instead."
    exit 1
fi

exit 0
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

## AWS Security

### IAM Best Practices

1. **Use IAM Roles** instead of access keys when possible
2. **Limit Permissions**: Only grant necessary permissions
3. **Use MFA**: Enable multi-factor authentication
4. **Rotate Keys**: Regularly rotate access keys
5. **Monitor Usage**: Set up CloudTrail to monitor API usage

### SageMaker Security

1. **Encrypt Models**: Use encryption at rest
2. **VPC Configuration**: Deploy endpoints in VPC
3. **Access Control**: Use IAM policies to restrict access
4. **Monitor Logs**: Enable CloudWatch logging

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** create a public issue
2. Contact the maintainers privately
3. Provide details of the vulnerability
4. Wait for confirmation before disclosing

## Resources

- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [AWS Security Best Practices](https://aws.amazon.com/security/security-resources/)
- [12-Factor App: Config](https://12factor.net/config)

