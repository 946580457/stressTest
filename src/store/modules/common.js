import { sendStressRequest } from "../../api/client";

function createInitialState() {
  return {
    running: false,
    stopRequested: false,
    stats: {
      scheduled: 0,
      completed: 0,
      success: 0,
      failed: 0,
      avgLatency: 0,
      maxLatency: 0,
      minLatency: 0,
      qps: 0,
      startedAt: null,
      endedAt: null,
      elapsedMs: 0
    },
    logs: []
  };
}

function parseJsonObject(text, label) {
  if (!text || !String(text).trim()) {
    return {};
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} 不是有效 JSON`);
  }

  if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error(`${label} 必须是 JSON 对象`);
  }

  return parsed;
}

function createPayload(sizeInKb) {
  const bytes = Math.max(sizeInKb, 1) * 1024;
  return "X".repeat(bytes);
}

function clampConcurrency(value, total) {
  return Math.max(1, Math.min(Number(value) || 1, Number(total) || 1));
}

async function runPool(tasks, concurrency) {
  const workers = Array.from({ length: concurrency }, async () => {
    while (tasks.length > 0) {
      const task = tasks.shift();
      if (!task) {
        return;
      }
      await task();
    }
  });

  await Promise.all(workers);
}

export default {
  namespaced: true,
  state: createInitialState(),
  getters: {
    successRate(state) {
      if (!state.stats.completed) {
        return 0;
      }
      return Number(((state.stats.success / state.stats.completed) * 100).toFixed(2));
    }
  },
  mutations: {
    setRunning(state, value) {
      state.running = value;
    },
    setStopRequested(state, value) {
      state.stopRequested = value;
    },
    resetStats(state) {
      state.stats = {
        scheduled: 0,
        completed: 0,
        success: 0,
        failed: 0,
        avgLatency: 0,
        maxLatency: 0,
        minLatency: 0,
        qps: 0,
        startedAt: null,
        endedAt: null,
        elapsedMs: 0
      };
      state.logs = [];
    },
    startRun(state) {
      state.stats.startedAt = Date.now();
    },
    finishRun(state) {
      state.stats.endedAt = Date.now();
      state.stats.elapsedMs = state.stats.endedAt - state.stats.startedAt;
      state.stats.qps = state.stats.elapsedMs
        ? Number(((state.stats.completed * 1000) / state.stats.elapsedMs).toFixed(2))
        : 0;
    },
    markScheduled(state, count) {
      state.stats.scheduled += count;
    },
    recordResult(state, payload) {
      const { ok, latency, message } = payload;
      state.stats.completed += 1;
      if (ok) {
        state.stats.success += 1;
      } else {
        state.stats.failed += 1;
      }

      if (state.stats.completed === 1) {
        state.stats.minLatency = latency;
        state.stats.maxLatency = latency;
        state.stats.avgLatency = latency;
      } else {
        state.stats.minLatency = Math.min(state.stats.minLatency, latency);
        state.stats.maxLatency = Math.max(state.stats.maxLatency, latency);
        const totalLatency = state.stats.avgLatency * (state.stats.completed - 1) + latency;
        state.stats.avgLatency = Number((totalLatency / state.stats.completed).toFixed(2));
      }

      const elapsed = Date.now() - state.stats.startedAt;
      state.stats.elapsedMs = elapsed;
      state.stats.qps = elapsed
        ? Number(((state.stats.completed * 1000) / elapsed).toFixed(2))
        : 0;

      if (state.logs.length >= 200) {
        state.logs.pop();
      }
      state.logs.unshift({
        id: `${Date.now()}-${state.stats.completed}`,
        ok,
        latency,
        message,
        time: new Date().toLocaleTimeString("zh-CN", { hour12: false })
      });
    }
  },
  actions: {
    async startStressTest({ state, commit }, config) {
      if (state.running) {
        return;
      }

      commit("resetStats");
      commit("setRunning", true);
      commit("setStopRequested", false);
      commit("startRun");

      const safeConfig = { ...config };
      const requestUrl = (safeConfig.requestUrl || "").trim();
      if (!requestUrl) {
        commit("setRunning", false);
        throw new Error("请求 URL 不能为空");
      }

      const customParams = parseJsonObject(safeConfig.queryParams, "Query Params");
      const customBody = parseJsonObject(safeConfig.requestBody, "Request Body");
      const totalTasks = Number(safeConfig.concurrency) * Number(safeConfig.rounds);
      const payload = createPayload(Number(safeConfig.payloadSize));
      const concurrency = clampConcurrency(safeConfig.concurrency, totalTasks);
      commit("markScheduled", totalTasks);

      const tasks = Array.from({ length: totalTasks }, (_, index) => async () => {
        if (state.stopRequested) {
          return;
        }

        const controller = new AbortController();
        const startedAt = performance.now();

        try {
          await sendStressRequest(
            {
              timeout: Number(safeConfig.timeout),
              url: requestUrl,
              params: {
                ...customParams,
                requestId: index + 1
              },
              data: {
                ...customBody,
                requestId: index + 1,
                failureRate: Number(safeConfig.failureRate),
                minDelay: Number(safeConfig.minDelay),
                maxDelay: Number(safeConfig.maxDelay),
                payload
              }
            },
            controller.signal
          );

          const latency = Number((performance.now() - startedAt).toFixed(2));
          commit("recordResult", {
            ok: true,
            latency,
            message: `请求 ${index + 1} 成功`
          });
        } catch (error) {
          const latency = Number((performance.now() - startedAt).toFixed(2));
          commit("recordResult", {
            ok: false,
            latency,
            message: error.response?.data?.message || error.message || `请求 ${index + 1} 失败`
          });
        }
      });

      try {
        await runPool(tasks, concurrency);
      } finally {
        commit("finishRun");
        commit("setRunning", false);
      }
    },
    stopStressTest({ commit }) {
      commit("setStopRequested", true);
    }
  }
};
