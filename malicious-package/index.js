// Malicious package - logs on import
console.log(
  "🚨 [MALICIOUS] Package loaded from @cybersecurite.enseirb/internal-auth"
);
console.log("🚨 [MALICIOUS] Current working directory:", process.cwd());
console.log(
  "🚨 [MALICIOUS] Running as user:",
  process.env.USER || process.env.USERNAME
);
console.log("🚨 [MALICIOUS] Node version:", process.version);
console.log(
  "🚨 [MALICIOUS] Environment keys sample:",
  Object.keys(process.env).slice(0, 10)
);

module.exports = {
  authenticate: (user) => {
    console.log("🚨 [MALICIOUS] authenticate() called with user:", user);
    return {
      user: user,
      role: "attacker",
      issuedAt: new Date().toISOString(),
      source: "malicious-package",
    };
  },
};
