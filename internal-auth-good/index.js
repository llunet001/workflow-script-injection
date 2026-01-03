function authenticate(user) {
  return {
    user,
    role: user === "admin" ? "admin" : "viewer",
    issuedAt: new Date().toISOString(),
  };
}

module.exports = { authenticate };
