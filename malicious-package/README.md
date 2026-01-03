# Malicious NPM Package - Dependency Confusion Demo

This package demonstrates a **dependency confusion attack** where:

1. Attacker discovers a company uses internal package `@mycompany/internal-auth`
2. Attacker publishes a malicious package with the SAME NAME to public npm registry
3. Uses a very high version number (999.999.999) to ensure it gets picked
4. During CI/CD `npm install`, npm downloads the malicious public version
5. The `postinstall` script runs automatically and exfiltrates secrets

## How to Demo

**DO NOT publish this to real npm!** This is for local testing only.

### Simulate the attack locally:

```bash
cd malicious-package
npm install
```

The postinstall script will execute and show what gets exfiltrated.

## Real-World Examples

- **Codecov** (2021): Attacker modified build script to exfiltrate credentials
- **UAParser.js** (2021): Package hijacked, crypto miners installed
- **Alex Birsan** (2021): Earned $130k in bug bounties by uploading packages with internal names

## Mitigation

1. **Use scoped registries in .npmrc:**

   ```
   @mycompany:registry=https://npm.pkg.github.com
   ```

2. **Use --ignore-scripts:**

   ```
   npm install --ignore-scripts
   ```

3. **Lock down versions:**

   ```
   npm ci --frozen-lockfile
   ```

4. **Private registry authentication**
5. **Audit regularly:** `npm audit`
