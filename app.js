const express = require("express");
const { exec } = require("child_process");
const sqlite3 = require("sqlite3").verbose();
const { authenticate } = require("@cybersecurite.enseirb/internal-auth");
const app = express();
const port = process.env.PORT || 3000;

// Initialize in-memory SQLite database
const db = new sqlite3.Database(":memory:");

// Create a sample users table
db.serialize(() => {
  db.run(
    "CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, email TEXT)"
  );
  db.run(
    "INSERT INTO users VALUES (1, 'admin', 'admin123', 'admin@example.com')"
  );
  db.run(
    "INSERT INTO users VALUES (2, 'alice', 'password', 'alice@example.com')"
  );
  db.run("INSERT INTO users VALUES (3, 'bob', 'secret', 'bob@example.com')");
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple rate limiting for DDoS demo
let requestCount = 0;
let lastReset = Date.now();

app.use((req, res, next) => {
  const now = Date.now();
  if (now - lastReset > 60000) {
    // Reset every minute
    requestCount = 0;
    lastReset = now;
  }
  requestCount++;

  // Log for DDoS demonstration
  if (requestCount > 100) {
    console.log(
      `⚠️ HIGH TRAFFIC DETECTED: ${requestCount} requests in the last minute`
    );
  }

  next();
});

// Serve a simple HTML page
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Script Injection Demosssss</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
          color: #333;
        }
        .warning {
          background-color: #fff3cd;
          border: 1px solid #ffc107;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        input[type="text"] {
          width: 100%;
          padding: 10px;
          margin: 10px 0;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-sizing: border-box;
        }
        button {
          background-color: #007bff;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }
        button:hover {
          background-color: #0056b3;
        }
        .result {
          margin-top: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 4px;
          border-left: 4px solid #007bff;
        }
        pre {
          background-color: #f4f4f4;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
        }
        .exploit-example {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          padding: 15px;
          border-radius: 4px;
          margin-top: 20px;
        }
        .auth-card {
          margin-top: 20px;
          padding: 15px;
          background: #e8f5ff;
          border-radius: 4px;
          border-left: 4px solid #007bff;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔓 Security Vulnerabilities Demo</h1>
        
        <div class="warning">
          ⚠️ <strong>Warning:</strong> This application intentionally contains security vulnerabilities for educational purposes. Never deploy this in production!
        </div>

        <div class="auth-card">
          <h3>Internal Auth (safe package)</h3>
          <p>Calling <code>@cybersecurite.enseirb/internal-auth</code> to show intended behavior.</p>
          <div class="result">
            <pre id="auth-result">Loading...</pre>
          </div>
        </div>

        <p><strong>Request Count:</strong> ${requestCount} requests in the last minute</p>

        <h2>1. Script Injection - Ping Command</h2>
        <p>Enter a hostname or IP address to ping:</p>
        
        <form action="/ping" method="POST">
          <input type="text" name="host" placeholder="e.g., google.com" required>
          <button type="submit">Ping Host</button>
        </form>

        <div class="exploit-example">
          <h3>💀 Script Injection Examples:</h3>
          <pre>google.com; whoami</pre>
          <pre>google.com && cat /etc/passwd</pre>
          <pre>google.com | echo "Vulnerable"</pre>
        </div>

        <hr style="margin: 30px 0;">

        <h2>2. SQL Injection - User Login</h2>
        <p>Enter a username to search:</p>
        
        <form action="/search-user" method="POST">
          <input type="text" name="username" placeholder="e.g., alice" required>
          <button type="submit">Search User</button>
        </form>

        <div class="exploit-example">
          <h3>💀 SQL Injection Examples:</h3>
          <pre>' OR '1'='1</pre>
          <pre>admin' --</pre>
          <pre>' UNION SELECT id, username, password FROM users --</pre>
        </div>

        <hr style="margin: 30px 0;">

        <h2>3. DDoS Simulation</h2>
        <p>This endpoint can be flooded to demonstrate DDoS:</p>
        <form action="/heavy-operation" method="POST">
          <button type="submit">Trigger Heavy Operation</button>
        </form>
        <p><small>Use tools like <code>ab</code>, <code>wrk</code>, or <code>slowloris</code> to test DDoS</small></p>

        <h3>How This Relates to GitHub Actions:</h3>
        <p>Just like this web app, GitHub Actions workflows are vulnerable when:</p>
        <ul>
          <li>User input (issue titles, comments, PR titles) is used directly in <code>run</code> commands</li>
          <li>Input is not properly sanitized or validated</li>
          <li>Expressions like <code>\${{ github.event.issue.title }}</code> are interpolated into shell commands</li>
        </ul>
      </div>
      <script>
        fetch('/auth-demo').then(r => r.json()).then(data => {
          const el = document.getElementById('auth-result');
          el.textContent = JSON.stringify(data, null, 2);
        }).catch(() => {
          const el = document.getElementById('auth-result');
          el.textContent = 'Failed to load auth data';
        });
      </script>
    </body>
    </html>
  `);
});

// VULNERABLE ENDPOINT - demonstrates script injection
app.post("/ping", (req, res) => {
  const host = req.body.host;

  // VULNERABILITY: User input is directly concatenated into a shell command
  // This is exactly what happens in GitHub Actions when you use:
  // run: |
  //   title="${{ github.event.issue.title }}"
  const command = `ping -c 4 ${host}`;

  console.log(`Executing command: ${command}`);

  exec(command, (error, stdout, stderr) => {
    const output = stdout || stderr || (error ? error.message : "");
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ping Result</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          pre {
            background-color: #f4f4f4;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            border-left: 4px solid ${error ? "#dc3545" : "#28a745"};
          }
          a {
            color: #007bff;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Command Result</h1>
          <p><strong>Executed:</strong> <code>${command}</code></p>
          <pre>${output}</pre>
          <p><a href="/">← Back to Demo</a></p>
        </div>
      </body>
      </html>
    `);
  });
});

// VULNERABLE ENDPOINT - SQL Injection
app.post("/search-user", (req, res) => {
  const username = req.body.username;

  // VULNERABILITY: User input is directly concatenated into SQL query
  const query = `SELECT * FROM users WHERE username = '${username}'`;

  console.log(`Executing query: ${query}`);

  db.all(query, [], (err, rows) => {
    let resultHtml = "";

    if (err) {
      resultHtml = `<div style="color: red;"><strong>Error:</strong> ${err.message}</div>`;
    } else if (rows.length === 0) {
      resultHtml = "<p>No users found.</p>";
    } else {
      resultHtml =
        '<table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%;"><tr><th>ID</th><th>Username</th><th>Password</th><th>Email</th></tr>';
      rows.forEach((row) => {
        resultHtml += `<tr><td>${row.id}</td><td>${row.username}</td><td>${row.password}</td><td>${row.email}</td></tr>`;
      });
      resultHtml += "</table>";
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Search Result</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          table {
            background-color: #f4f4f4;
            margin: 20px 0;
          }
          th {
            background-color: #007bff;
            color: white;
          }
          a {
            color: #007bff;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Search Results</h1>
          <p><strong>Query executed:</strong> <code>${query}</code></p>
          ${resultHtml}
          <p><a href="/">← Back to Demo</a></p>
        </div>
      </body>
      </html>
    `);
  });
});

// VULNERABLE ENDPOINT - DDoS target (resource intensive)
app.post("/heavy-operation", (req, res) => {
  console.log("Heavy operation triggered");

  // Simulate a resource-intensive operation
  let result = 0;
  for (let i = 0; i < 10000000; i++) {
    result += Math.sqrt(i);
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Operation Complete</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        a {
          color: #007bff;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>✅ Heavy Operation Complete</h1>
        <p>Computation result: ${result.toFixed(2)}</p>
        <p>This endpoint is vulnerable to DDoS attacks when flooded with requests.</p>
        <p><a href="/">← Back to Demo</a></p>
      </div>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    requests: requestCount,
    timestamp: new Date().toISOString(),
  });
});

// Safe endpoint demonstrating internal auth usage
app.get("/auth-demo", (req, res) => {
  const result = authenticate("demo-user");
  res.json({
    source: "@cybersecurite.enseirb/internal-auth",
    data: result,
  });
});

app.listen(port, () => {
  console.log(
    `Script injection demo app listening at http://localhost:${port}`
  );
  console.log(
    "⚠️  WARNING: This app contains intentional vulnerabilities for educational purposes!"
  );
});
