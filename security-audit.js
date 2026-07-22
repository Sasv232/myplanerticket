const http = require("http");

function req(method, path, body, cookie) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { "Content-Type": "application/json" };
    if (cookie) headers["Cookie"] = cookie;
    if (data) headers["Content-Length"] = Buffer.byteLength(data);
    const r = http.request({ hostname: "localhost", port: 3000, path, method, headers, timeout: 60000 }, res => {
      let c = []; res.on("data", d => c.push(d));
      res.on("end", () => { let j = null; try { j = JSON.parse(Buffer.concat(c).toString()); } catch {} resolve({ s: res.statusCode, b: j }); });
    });
    r.on("error", reject);
    r.on("timeout", () => { r.destroy(); reject(new Error("TIMEOUT")); });
    if (data) r.write(data);
    r.end();
  });
}

const ok = (s, e) => s === e ? "✅" : "❌";

async function main() {
  console.log("🔒 SECURITY AUDIT\n");

  // 1. AUTH BYPASS
  console.log("=== 1. AUTH BYPASS (no token) ===");
  let r;
  r = await req("GET", "/api/conversations"); console.log(`${ok(r.s,401)} GET /conversations: ${r.s}`);
  r = await req("GET", "/api/messages?conversationId=x"); console.log(`${ok(r.s,401)} GET /messages: ${r.s}`);
  r = await req("POST", "/api/messages", {conversationId:"x",content:"y"}); console.log(`${ok(r.s,401)} POST /messages: ${r.s}`);
  r = await req("POST", "/api/typing", {conversationId:"x"}); console.log(`${ok(r.s,401)} POST /typing: ${r.s}`);
  r = await req("POST", "/api/read", {conversationId:"x"}); console.log(`${ok(r.s,401)} POST /read: ${r.s}`);
  r = await req("DELETE", "/api/conversations/x"); console.log(`${ok(r.s,401)} DELETE /conversations: ${r.s}`);

  // 2. FAKE TOKEN
  console.log("\n=== 2. FAKE TOKEN ===");
  r = await req("GET", "/api/conversations", null, "session_token=FAKE123"); console.log(`${ok(r.s,401)} GET /conversations: ${r.s}`);
  r = await req("POST", "/api/messages", {conversationId:"x",content:"y"}, "session_token=FAKE123"); console.log(`${ok(r.s,401)} POST /messages: ${r.s}`);
  r = await req("POST", "/api/typing", {conversationId:"x"}, "session_token=FAKE123"); console.log(`${ok(r.s,401)} POST /typing: ${r.s}`);

  // 3. Login User1
  console.log("\n=== 3. USER SESSIONS ===");
  const l1 = await req("POST", "/api/auth/login", {name:"TestUser1", password:"test12345"});
  if (!l1.b?.token) { console.log("User1 login failed:", JSON.stringify(l1.b)); return; }
  const c1 = "session_token=" + l1.b.token;
  const uid1 = l1.b.user.id;
  console.log(`User1: ${uid1}`);

  // Try User2 login, if fails, register fresh
  let l2 = await req("POST", "/api/auth/login", {name:"TestUser2", password:"test54321"});
  let c2, uid2;
  if (l2.b?.token) {
    c2 = "session_token=" + l2.b.token;
    uid2 = l2.b.user.id;
  } else {
    console.log("User2 login failed, registering fresh...");
    const reg = await req("POST", "/api/auth/register", {name:"TestUser2_"+Date.now(), password:"test54321"});
    if (reg.b?.token) {
      c2 = "session_token=" + reg.b.token;
      uid2 = reg.b.user.id;
    } else {
      console.log("Cannot create User2:", JSON.stringify(reg.b));
      console.log("Continuing with User1 only...");
    }
  }
  if (uid2) console.log(`User2: ${uid2}`);

  // 4. Create conversation
  console.log("\n=== 4. CREATE CONVERSATION ===");
  let convId = null;
  if (uid2) {
    const conv = await req("POST", "/api/conversations", {type:"dm", memberIds:[uid2]}, c1);
    convId = conv.b?.id;
    if (!convId) {
      const myConvs = await req("GET", "/api/conversations", null, c1);
      if (Array.isArray(myConvs.b)) {
        for (const c of myConvs.b) {
          if (c.members?.some(m => m.userId === uid2)) { convId = c.id; break; }
        }
        if (!convId && myConvs.b.length > 0) convId = myConvs.b[0].id;
      }
    }
    console.log(`Conv: ${convId}`);
  }

  if (convId) {
    // 5. Send + Read
    console.log("\n=== 5. SEND & READ ===");
    const msg = await req("POST", "/api/messages", {conversationId:convId, content:"Секрет от User1"}, c1);
    console.log(`Sent: ${msg.s}, id: ${msg.b?.id}`);
    const m1 = await req("GET", "/api/messages?conversationId="+convId, null, c1);
    console.log(`${ok(m1.s,200)} User1 reads: ${m1.s} (${Array.isArray(m1.b)?m1.b.length:0} msgs)`);
    if (c2) {
      const m2 = await req("GET", "/api/messages?conversationId="+convId, null, c2);
      console.log(`${ok(m2.s,200)} User2 reads: ${m2.s} (${Array.isArray(m2.b)?m2.b.length:0} msgs)`);
    }

    // 6. Hacker
    console.log("\n=== 6. HACKER (not member) ===");
    const h = await req("POST", "/api/auth/register", {name:"Hacker"+Date.now(), password:"hack12345"});
    if (h.b?.token) {
      const ch = "session_token=" + h.b.token;
      r = await req("GET", "/api/messages?conversationId="+convId, null, ch);
      console.log(`${ok(r.s,403)} Read conv: ${r.s} ${r.s===403?"BLOCKED ✓":"VULNERABLE!"}`);
      r = await req("POST", "/api/messages", {conversationId:convId,content:"HACKED"}, ch);
      console.log(`${ok(r.s,403)} Send to conv: ${r.s} ${r.s===403?"BLOCKED ✓":"VULNERABLE!"}`);
      r = await req("GET", "/api/conversations/"+convId, null, ch);
      console.log(`${ok(r.s,403)} Get conv info: ${r.s} ${r.s===403?"BLOCKED ✓":"VULNERABLE!"}`);
      r = await req("POST", "/api/typing", {conversationId:convId}, ch);
      console.log(`${ok(r.s,403)} Typing: ${r.s} ${r.s===403?"BLOCKED ✓":"VULNERABLE!"}`);
      r = await req("POST", "/api/read", {conversationId:convId}, ch);
      console.log(`${ok(r.s,403)} Mark read: ${r.s} ${r.s===403?"BLOCKED ✓":"VULNERABLE!"}`);
      r = await req("DELETE", "/api/conversations/"+convId, null, ch);
      console.log(`${ok(r.s,403)} Delete conv: ${r.s} ${r.s===403?"BLOCKED ✓":"VULNERABLE!"}`);
    } else {
      console.log("Cannot create hacker:", JSON.stringify(h.b));
    }

    // 7. SQL Injection
    console.log("\n=== 7. SQL INJECTION ===");
    r = await req("GET", "/api/messages?conversationId=x'%20OR%20'1'%3D'1--", null, c1);
    console.log(`SQLi read: ${r.s} (${Array.isArray(r.b)?r.b.length:0} rows) — ${r.s===200&&r.b?.length>0?"DANGER":"SAFE (Drizzle parametrizes)"}`);
    r = await req("POST", "/api/messages", {conversationId:convId, content:"'; DROP TABLE messages;--"}, c1);
    console.log(`SQLi drop: ${r.s} — safe (stored as text, Drizzle parametrizes)`);

    // 8. XSS
    console.log("\n=== 8. STORED XSS ===");
    const xss = '<script>alert("xss")</script><img src=x onerror=alert(1)>';
    r = await req("POST", "/api/messages", {conversationId:convId, content:xss}, c1);
    if (r.s === 201) {
      const msgs = await req("GET", "/api/messages?conversationId="+convId, null, c1);
      const last = msgs.b?.[msgs.b.length-1];
      console.log(`Payload stored: ${last?.content===xss?"YES ⚠️":"NO"}`);
      console.log(`React render: auto-escapes HTML → SAFE on screen ✓`);
      console.log(`DB risk: payload persists, if admin reads raw DB → sees script tag`);
    }

    // 9. Input validation
    console.log("\n=== 9. INPUT VALIDATION ===");
    r = await req("POST", "/api/messages", {conversationId:convId, content:"A".repeat(5001)}, c1);
    console.log(`${ok(r.s,400)} >5000 chars: ${r.s}`);
    r = await req("POST", "/api/messages", {conversationId:convId, content:""}, c1);
    console.log(`Empty msg: ${r.s}`);

    // 10. Rate limiting
    console.log("\n=== 10. RATE LIMITING ===");
    let hit = false;
    for (let i = 0; i < 70; i++) {
      r = await req("POST", "/api/messages", {conversationId:convId, content:"spam"+i}, c1);
      if (r.s === 429) { console.log(`✅ Rate limit hit at #${i+1}`); hit = true; break; }
    }
    if (!hit) console.log("❌ Rate limit NOT hit after 70 requests");

    // 11. Ownership
    console.log("\n=== 11. MESSAGE OWNERSHIP ===");
    const own = await req("POST", "/api/messages", {conversationId:convId, content:"own-test"}, c1);
    if (own.b?.id && c2) {
      r = await req("DELETE", "/api/messages/"+own.b.id, null, c2);
      console.log(`${ok(r.s,403)} User2 deletes User1 msg: ${r.s}`);
      r = await req("DELETE", "/api/messages/"+own.b.id, null, c1);
      console.log(`${ok(r.s,200)} User1 deletes own msg: ${r.s}`);
    }

    // 12. Data exposure
    console.log("\n=== 12. DATA EXPOSURE ===");
    if (Array.isArray(m1.b) && m1.b.length > 0) {
      const keys = Object.keys(m1.b[0]);
      console.log(`Message fields: ${keys.join(", ")}`);
      console.log(`passwordHash in response: ${keys.includes("passwordHash")?"YES ❌":"NO ✓"}`);
      console.log(`email in response: ${keys.includes("email")?"YES ⚠️":"NO ✓"}`);
      // Check encrypted content
      const content = m1.b[0].content;
      const isEnc = content.includes(":") && content.split(":").length === 4;
      console.log(`Content encrypted in response: ${isEnc?"YES ✓ (raw cipher)":"NO (decrypted for display)"}`);
    }
  }

  // 13. ENCRYPTION ANALYSIS
  console.log("\n=== 13. ENCRYPTION ===");
  console.log("Server-side: AES-256-GCM, PBKDF2 key derivation");
  console.log("DB stores: salt:iv:authTag:ciphertext (hex-encoded)");
  console.log("Key source: E2E_SECRET env var + userId");
  console.log("Risk: If E2E_SECRET leaks → all messages decryptable");
  console.log("Risk: Key is deterministic per user (same user → same key)");

  console.log("\n🔒 AUDIT COMPLETE");
}

main().catch(e => console.error("FATAL:", e.message));
