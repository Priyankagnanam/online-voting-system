const http = require("http");

const BASE = "http://localhost:5000/api";
let passed = 0;
let failed = 0;

const request = (method, path, body, token) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      method,
      hostname: "localhost",
      port: 5000,
      path: url.pathname + url.search,
      headers: { "Content-Type": "application/json" },
    };
    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

const test = async (name, fn) => {
  try {
    await fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (error) {
    failed++;
    console.log(`  FAIL  ${name}`);
    console.log(`        ${error.message}`);
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

let voterToken;
let adminToken;
let electionId;
let candidateId;
const testEmail = `testvoter${Date.now()}@test.com`;
const testPassword = "test123456";

const runTests = async () => {
  console.log("\n=== Online Voting System — API Tests ===\n");

  // --- Health ---
  console.log("Health Check:");
  await test("GET /api/health returns ok", async () => {
    const { status, body } = await request("GET", "/api/health");
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.status === "ok", `Expected status ok, got ${body.status}`);
  });

  // --- Register ---
  console.log("\nVoter Registration:");
  await test("POST /api/auth/register creates new voter", async () => {
    const { status, body } = await request("POST", "/api/auth/register", {
      name: "Test Voter",
      email: testEmail,
      password: testPassword,
    });
    assert(status === 201, `Expected 201, got ${status}`);
    assert(body.message.includes("Registration"), body.message);
  });

  await test("POST /api/auth/register rejects duplicate email", async () => {
    const { status } = await request("POST", "/api/auth/register", {
      name: "Test Voter",
      email: testEmail,
      password: testPassword,
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test("POST /api/auth/register rejects short password", async () => {
    const { status } = await request("POST", "/api/auth/register", {
      name: "Test",
      email: "short@test.com",
      password: "123",
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  // --- Login before verification ---
  console.log("\nLogin (before OTP verification):");
  await test("POST /api/auth/login rejects unverified user", async () => {
    const { status } = await request("POST", "/api/auth/login", {
      email: testEmail,
      password: testPassword,
    });
    assert(status === 403, `Expected 403, got ${status}`);
  });

  // --- Admin login (needs seed) ---
  console.log("\nAdmin Login:");
  await test("POST /api/auth/login with wrong password fails", async () => {
    const { status } = await request("POST", "/api/auth/login", {
      email: "admin@voting.com",
      password: "wrongpassword",
    });
    assert(status === 401, `Expected 401, got ${status}`);
  });

  await test("POST /api/auth/login with admin credentials", async () => {
    require("dotenv").config();
    const adminEmail = (process.env.ADMIN_EMAIL || "gpriyanka17052006@gmail.com")
      .replace(/^["']|["']$/g, "")
      .toLowerCase()
      .trim();
    const adminPassword = (process.env.ADMIN_PASSWORD || "Priyanka@07")
      .replace(/^["']|["']$/g, "")
      .trim();
    const { status, body } = await request("POST", "/api/auth/login", {
      email: adminEmail,
      password: adminPassword,
    });
    if (status === 200) {
      adminToken = body.token;
      assert(body.user.role === "admin", "User is not admin");
    } else {
      console.log("        (Admin not seeded — run 'npm run seed' first)");
      assert(false, `Expected 200, got ${status}`);
    }
  });

  // --- No token ---
  console.log("\nAuth Middleware:");
  await test("GET /api/auth/me without token returns 401", async () => {
    const { status } = await request("GET", "/api/auth/me");
    assert(status === 401, `Expected 401, got ${status}`);
  });

  await test("GET /api/auth/me with invalid token returns 401", async () => {
    const { status } = await request("GET", "/api/auth/me", null, "badtoken");
    assert(status === 401, `Expected 401, got ${status}`);
  });

  // --- Admin role checks ---
  if (adminToken) {
    console.log("\nRole Authorization:");
    await test("GET /api/auth/me with valid admin token", async () => {
      const { status, body } = await request("GET", "/api/auth/me", null, adminToken);
      assert(status === 200, `Expected 200, got ${status}`);
      assert(body.user.role === "admin", "Not admin");
    });

    // --- Election CRUD ---
    console.log("\nElection Management:");
    await test("POST /api/elections creates election (admin)", async () => {
      const { status, body } = await request("POST", "/api/elections", {
        title: "Test Election",
        description: "Test description",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }, adminToken);
      assert(status === 201, `Expected 201, got ${status}`);
      electionId = body.election._id;
    });

    await test("POST /api/elections rejects voter role", async () => {
      const { status } = await request("POST", "/api/elections", {
        title: "Fail",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
      }, "fake_voter_token");
      assert(status === 401, `Expected 401, got ${status}`);
    });

    await test("GET /api/elections lists elections", async () => {
      const { status, body } = await request("GET", "/api/elections", null, adminToken);
      assert(status === 200, `Expected 200, got ${status}`);
      assert(body.elections.length > 0, "No elections found");
    });

    await test("PATCH /api/elections/:id/status sets active", async () => {
      const { status, body } = await request("PATCH", `/api/elections/${electionId}/status`, {
        status: "active",
      }, adminToken);
      assert(status === 200, `Expected 200, got ${status}`);
      assert(body.election.status === "active", `Expected active, got ${body.election.status}`);
    });

    // --- Candidate CRUD ---
    console.log("\nCandidate Management:");
    await test("POST /api/candidates adds candidate", async () => {
      const { status, body } = await request("POST", "/api/candidates", {
        name: "Alice Smith",
        party: "Progress Party",
        description: "Test candidate",
        electionId,
      }, adminToken);
      assert(status === 201, `Expected 201, got ${status}`);
      candidateId = body.candidate._id;
    });

    await test("POST /api/candidates rejects invalid electionId", async () => {
      const { status } = await request("POST", "/api/candidates", {
        name: "Bad",
        electionId: "000000000000000000000000",
      }, adminToken);
      assert(status === 404, `Expected 404, got ${status}`);
    });

    await test("GET /api/candidates lists all", async () => {
      const { status, body } = await request("GET", "/api/candidates", null, adminToken);
      assert(status === 200, `Expected 200, got ${status}`);
      assert(body.candidates.length > 0, "No candidates found");
    });

    await test("GET /api/candidates/by-election/:id filters correctly", async () => {
      const { status, body } = await request("GET", `/api/candidates/by-election/${electionId}`, null, adminToken);
      assert(status === 200, `Expected 200, got ${status}`);
      assert(body.candidates.length > 0, "No candidates for this election");
    });

    // --- Admin dashboard ---
    console.log("\nAdmin Dashboard:");
    await test("GET /api/admin/dashboard returns stats", async () => {
      const { status, body } = await request("GET", "/api/admin/dashboard", null, adminToken);
      assert(status === 200, `Expected 200, got ${status}`);
      assert(typeof body.totalVoters === "number", "Missing totalVoters");
      assert(typeof body.totalElections === "number", "Missing totalElections");
    });

    await test("GET /api/admin/users returns user list", async () => {
      const { status, body } = await request("GET", "/api/admin/users", null, adminToken);
      assert(status === 200, `Expected 200, got ${status}`);
      assert(Array.isArray(body.users), "users is not array");
    });

    await test("GET /api/admin/security-alerts returns alerts", async () => {
      const { status, body } = await request("GET", "/api/admin/security-alerts", null, adminToken);
      assert(status === 200, `Expected 200, got ${status}`);
      assert(typeof body.total === "number", "Missing total");
    });

    await test("GET /api/admin/results returns results", async () => {
      const { status, body } = await request("GET", "/api/admin/results", null, adminToken);
      assert(status === 200, `Expected 200, got ${status}`);
      assert(Array.isArray(body.results), "results is not array");
    });

    // --- Cleanup ---
    console.log("\nCleanup:");
    await test("DELETE /api/candidates/:id removes candidate", async () => {
      const { status } = await request("DELETE", `/api/candidates/${candidateId}`, null, adminToken);
      assert(status === 200, `Expected 200, got ${status}`);
    });

    await test("DELETE /api/elections/:id removes election", async () => {
      await request("PATCH", `/api/elections/${electionId}/status`, { status: "ended" }, adminToken);
      const { status } = await request("DELETE", `/api/elections/${electionId}`, null, adminToken);
      assert(status === 200, `Expected 200, got ${status}`);
    });
  }

  // --- 404 ---
  console.log("\nError Handling:");
  await test("GET /api/nonexistent returns 404", async () => {
    const { status } = await request("GET", "/api/nonexistent");
    assert(status === 404, `Expected 404, got ${status}`);
  });

  // --- Summary ---
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
};

runTests().catch((error) => {
  console.error("Test runner error:", error.message);
  process.exit(1);
});
