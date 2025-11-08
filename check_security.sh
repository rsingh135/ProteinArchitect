#!/bin/bash

# Security Check Script
# Run this before committing to ensure no secrets are leaked

echo "🔒 Running Security Checks..."
echo ""

ERRORS=0
WARNINGS=0

# Check 1: Verify .env is in .gitignore
echo "1. Checking .gitignore for .env..."
if grep -q "^\.env$" .gitignore || grep -q "^\*\.env$" .gitignore; then
    echo "   ✅ .env is properly ignored"
else
    echo "   ❌ ERROR: .env is NOT in .gitignore!"
    ERRORS=$((ERRORS + 1))
fi

# Check 2: Verify .env is not tracked by git
echo "2. Checking if .env is tracked by git..."
if git ls-files | grep -q "\.env$"; then
    echo "   ❌ ERROR: .env file is tracked by git!"
    echo "   Run: git rm --cached backend/.env"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ .env is not tracked by git"
fi

# Check 3: Check for hardcoded API keys (only check for actual key values, not parameters)
echo "3. Checking for hardcoded API keys in code..."
# Look for patterns like: api_key="AIza..." or API_KEY='sk-...' (actual key patterns)
HARDCODED_KEYS=$(grep -r -E "(api_key|API_KEY|apiKey)\s*=\s*[\"'][A-Za-z0-9_-]{20,}[\"']" --include="*.py" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v ".env.example" | grep -v "SECURITY.md" | grep -v "README.md" | grep -v "\.git" | grep -v "node_modules" | grep -v "venv" | grep -v "__pycache__" | grep -v "test" | grep -v "example")

if [ -z "$HARDCODED_KEYS" ]; then
    echo "   ✅ No hardcoded API keys found"
else
    echo "   ❌ ERROR: Hardcoded API keys found:"
    echo "$HARDCODED_KEYS" | sed 's/^/      /'
    ERRORS=$((ERRORS + 1))
fi

# Check 4: Check for AWS credentials
echo "4. Checking for AWS credentials in code..."
AWS_CREDS=$(grep -r "AWS_SECRET" --include="*.py" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v ".env.example" | grep -v "os.getenv" | grep -v "process.env" | grep -v "SECURITY.md" | grep -v "README.md" | grep -v "\.git" | grep -v "node_modules" | grep -v "venv")

if [ -z "$AWS_CREDS" ]; then
    echo "   ✅ No hardcoded AWS credentials found"
else
    echo "   ⚠️  WARNING: Possible AWS credentials found:"
    echo "$AWS_CREDS" | sed 's/^/      /'
    WARNINGS=$((WARNINGS + 1))
fi

# Check 5: Verify .env.example exists
echo "5. Checking for .env.example file..."
if [ -f "backend/.env.example" ]; then
    echo "   ✅ .env.example exists"
else
    echo "   ⚠️  WARNING: .env.example not found"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 6: Check for .env files in staging area
echo "6. Checking staged files for .env..."
STAGED_ENV=$(git diff --cached --name-only | grep "\.env$")
if [ -z "$STAGED_ENV" ]; then
    echo "   ✅ No .env files in staging area"
else
    echo "   ❌ ERROR: .env file is staged for commit!"
    echo "   Run: git reset HEAD backend/.env"
    ERRORS=$((ERRORS + 1))
fi

# Check 7: Check for common secret patterns
echo "7. Checking for common secret patterns..."
SECRETS=$(grep -r -i "password.*=" --include="*.py" --include="*.js" . 2>/dev/null | grep -v ".env.example" | grep -v "os.getenv" | grep -v "process.env" | grep -v "SECURITY.md" | grep -v "README.md" | grep -v "\.git" | grep -v "node_modules" | grep -v "venv" | grep -v "test" | grep -v "example")

if [ -z "$SECRETS" ]; then
    echo "   ✅ No obvious password patterns found"
else
    echo "   ⚠️  WARNING: Possible password patterns found:"
    echo "$SECRETS" | head -5 | sed 's/^/      /'
    WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
echo "=========================================="
echo "Security Check Summary"
echo "=========================================="
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ All checks passed! Safe to commit."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  Some warnings found. Review before committing."
    exit 0
else
    echo "❌ ERRORS FOUND! Do not commit until fixed."
    exit 1
fi

