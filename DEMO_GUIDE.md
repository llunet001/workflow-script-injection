# Script Injection Demo Application

This is a simple Node.js web application that demonstrates script injection vulnerabilities, similar to those found in GitHub Actions workflows.

## 🚀 Running the Demo App

### Local Development

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the application:**

   ```bash
   npm start
   ```

3. **Access the app:**
   Open your browser and navigate to `http://localhost:3000`

### Using Docker

1. **Build the Docker image:**

   ```bash
   docker build -t script-injection-demo .
   ```

2. **Run the container:**

   ```bash
   docker run -p 3000:3000 script-injection-demo
   ```

3. **Access the app:**
   Open your browser and navigate to `http://localhost:3000`

## 🎯 How to Demo Script Injection

### In the Web App

1. Navigate to `http://localhost:3000`
2. Try these injection examples in the "Ping Host" form:

   **Basic injection (Linux/Mac):**

   ```
   google.com; whoami
   google.com && cat /etc/passwd
   google.com | echo "Injected command!"
   ```

   **Windows PowerShell injection:**

   ```
   google.com; whoami
   google.com & dir
   google.com && echo "Injected!"
   ```

3. Observe how the additional commands are executed alongside the ping command

### In GitHub Actions

The repository includes vulnerable workflows that demonstrate the same concept:

1. **check-issue-title.yml** - Vulnerable to injection via issue title

   - Create an issue with title: `octocat'; echo 'injected' #`
   - The workflow will execute the injected command

2. **check-issue-comment.yml** - Vulnerable to injection via comment body

   - Comment on an issue with: `octocat"; console.log('injected'); //`
   - The workflow will execute the injected code

3. **deploy-demo-app.yml** - Vulnerable to injection via workflow inputs
   - Trigger manually with input: `staging; echo 'injected'`
   - The workflow will execute the injected command

## 🔒 Mitigation Strategies

### For the Web App

**VULNERABLE:**

```javascript
const command = `ping -c 4 ${host}`;
exec(command, ...);
```

**SECURE:**

```javascript
// Use parameterized execution
execFile('ping', ['-c', '4', host], ...);

// Or validate/sanitize input
const safeHost = host.replace(/[^a-zA-Z0-9.-]/g, '');
```

### For GitHub Actions

**VULNERABLE:**

```yaml
- name: Check issue title
  run: |
    title="${{ github.event.issue.title }}"
    echo "Title is: $title"
```

**SECURE - Option 1: Use environment variables**

```yaml
- name: Check issue title
  env:
    ISSUE_TITLE: ${{ github.event.issue.title }}
  run: |
    echo "Title is: $ISSUE_TITLE"
```

**SECURE - Option 2: Use actions/github-script**

```yaml
- name: Check issue title
  uses: actions/github-script@v6
  with:
    script: |
      const title = context.payload.issue.title;
      console.log(`Title is: ${title}`);
```

## 📚 Learning Points

1. **User Input is Dangerous**: Never trust user input, whether from web forms or GitHub events
2. **Context Matters**: The same vulnerability pattern appears in different contexts (web apps, CI/CD)
3. **Defense in Depth**: Use multiple layers of protection (validation, sanitization, parameterization)
4. **Least Privilege**: Run processes with minimal required permissions

## 🎓 Educational Use Only

This application intentionally contains security vulnerabilities for educational purposes.

**⚠️ DO NOT deploy this application to production or any publicly accessible environment!**

Use it only in controlled, local environments for learning and demonstration purposes.
