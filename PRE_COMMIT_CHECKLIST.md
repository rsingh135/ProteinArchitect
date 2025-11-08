# ✅ Pre-Commit Checklist

## Before Every Commit

Run this checklist to ensure you don't accidentally commit secrets:

### 1. Run Security Check
```bash
./check_security.sh
```

### 2. Manual Checks

- [ ] **Check git status**: `git status`
  - Verify no `.env` files appear
  - Verify no `*.key`, `*.pem` files appear
  - Verify no credential files appear

- [ ] **Check staged files**: `git diff --cached --name-only`
  - Review all files being committed
  - Ensure no sensitive files are staged

- [ ] **Verify .env is ignored**: `git check-ignore backend/.env`
  - Should return: `backend/.env`

- [ ] **Check for API keys in code**: 
  ```bash
  git diff --cached | grep -i "api.*key.*=" | grep -v "os.getenv" | grep -v "process.env"
  ```
  - Should return nothing

### 3. Quick Commands

```bash
# Check what will be committed
git status

# Review changes
git diff --cached

# Verify .env is not tracked
git ls-files | grep .env
# Should only show: backend/.env.example

# Run security check
./check_security.sh
```

### 4. If Issues Found

**If .env is tracked**:
```bash
git rm --cached backend/.env
git commit -m "Remove .env from git tracking"
```

**If hardcoded keys found**:
1. Remove the hardcoded key
2. Use environment variable instead
3. Add key to `.env` file
4. Verify `.env` is in `.gitignore`

**If secrets are in commit history**:
1. Rotate the keys immediately
2. Remove from git history (see SECURITY.md)
3. Force push (coordinate with team)

## Quick Reference

```bash
# Full security check
./check_security.sh

# Quick check
git status | grep -E "\.env$|\.key$|secret|credential"

# Verify .gitignore
cat .gitignore | grep -E "^\\.env$|^\*\.env$"
```

## Remember

- ✅ `.env.example` can be committed (template file)
- ❌ `.env` should NEVER be committed
- ✅ Use environment variables in code
- ❌ Never hardcode API keys
- ✅ Run security check before every commit

