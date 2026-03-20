const express = require("express");

const app = express();
app.use(express.json({ limit: "1mb" }));

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.post("/api/stress", async (req, res) => {
  const {
    requestId,
    failureRate = 0.1,
    minDelay = 50,
    maxDelay = 500,
    timeout = 5000,
    payload = ""
  } = req.body || {};

  const safeMin = Math.max(0, Number(minDelay));
  const safeMax = Math.max(safeMin + 1, Number(maxDelay));
  const delay = Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;

  await wait(Math.min(delay, Number(timeout)));

  if (Math.random() < Number(failureRate)) {
    return res.status(503).json({
      success: false,
      requestId,
      message: "模拟服务繁忙，触发随机失败"
    });
  }

  return res.json({
    success: true,
    requestId,
    payloadBytes: Buffer.byteLength(payload || "", "utf8"),
    delay
  });
});

app.listen(3001, () => {
  console.log("Mock stress server running at http://127.0.0.1:3001");
});
