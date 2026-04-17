const express = require("express");
const fs = require("fs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const FILE = "data.json";
const SECRET = "P4P_SUPER_SECRET_KEY_2026";
const JWT_SECRET = "JWT_SECRET_9x!P4P";

const LIMIT = {};
const TOKENS = {};

if (!fs.existsSync(FILE)) {
  fs.writeFileSync(FILE, "[]");
}

function encrypt(text) {
  const cipher = crypto.createCipher("aes-256-cbc", SECRET);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

function decrypt(text) {
  const decipher = crypto.createDecipher("aes-256-cbc", SECRET);
  let decrypted = decipher.update(text, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function generateToken() {
  const token = crypto.randomBytes(16).toString("hex");
  TOKENS[token] = Date.now();
  return token;
}

app.get("/token", (req, res) => {
  res.json({ token: generateToken() });
});

// 🔢 СЧЁТЧИК
app.get("/count", (req, res) => {
  const data = JSON.parse(fs.readFileSync(FILE));
  res.json({ count: data.length });
});

app.post("/sign", (req, res) => {
  const ip =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress;

  const { name, studentClass, token } = req.body;

  if (!name || !studentClass || !token) {
    return res.status(400).send("error");
  }

  if (!TOKENS[token]) {
    return res.status(403).send("bot detected");
  }

  delete TOKENS[token];

  if (LIMIT[ip] && Date.now() - LIMIT[ip] < 10000) {
    return res.status(429).send("too fast");
  }

  LIMIT[ip] = Date.now();

  const data = JSON.parse(fs.readFileSync(FILE));

  if (data.find(d => d.ip === ip)) {
    return res.status(403).send("already signed");
  }

  data.push({
    name: encrypt(name),
    studentClass: encrypt(studentClass),
    ip,
    date: new Date().toLocaleString()
  });

  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));

  console.log("OK:", name, studentClass, ip);

  res.send("ok");
});

// 🔐 админ
app.post("/admin-login", (req, res) => {
  if (req.body.password !== "P4P_secure_9Xk2!admin") {
    return res.status(403).send("wrong");
  }

  const token = jwt.sign({ role: "admin" }, JWT_SECRET, {
    expiresIn: "1h"
  });

  res.json({ token });
});

app.get("/admin-data", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).send("no token");

  try {
    const decoded = jwt.verify(auth.split(" ")[1], JWT_SECRET);

    const data = JSON.parse(fs.readFileSync(FILE));

    res.json(
      data.map(d => ({
        name: decrypt(d.name),
        studentClass: decrypt(d.studentClass),
        ip: d.ip,
        date: d.date
      }))
    );
  } catch {
    res.status(403).send("invalid token");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
