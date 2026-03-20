<template>
  <div class="stress-page">
    <section class="hero">
      <div>
        <p class="eyebrow">API Flow</p>
        <h2>单接口压力测试控制台</h2>
        <p class="hero-copy">
          面向接口压测与调试场景，支持自定义请求 URL、Query Params、Request Body，并可配置线程数、循环次数与实时结果统计。
        </p>
      </div>
      <div class="hero-badge">
        <span>实时 QPS</span>
        <strong>{{ stats.qps }}</strong>
      </div>
    </section>

    <el-row :gutter="20" class="content-grid stress-layout-row">
      <el-col :xs="24" :lg="10" class="stress-left-col">
        <el-card class="panel-card stress-config-card" shadow="hover">
          <template #header>
            <div class="panel-header">
              <span>请求配置</span>
              <el-tag type="warning">压测模式</el-tag>
            </div>
          </template>

          <el-form label-position="top" :model="form">
            <el-row :gutter="12">
              <el-col :span="8">
                <el-form-item label="请求方法">
                  <el-select v-model="form.method" class="full-input" :disabled="running">
                    <el-option label="GET" value="get" />
                    <el-option label="POST" value="post" />
                    <el-option label="PUT" value="put" />
                    <el-option label="DELETE" value="delete" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="16">
                <el-form-item label="请求 URL">
                  <el-input
                    v-model="form.requestUrl"
                    placeholder="例如：http://113.207.49.180:3030"
                    :disabled="running"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="循环次数">
                  <el-input-number
                    v-model="form.rounds"
                    :min="1"
                    :max="100000"
                    :step="1"
                    class="full-input"
                    :disabled="running"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="线程数">
                  <el-input-number
                    v-model="form.concurrency"
                    :min="1"
                    :max="10000"
                    :step="1"
                    class="full-input"
                    :disabled="running"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <div class="advanced-block">
              <div class="advanced-title">高级请求配置</div>
              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="Query Params(JSON)">
                    <el-input
                      v-model="form.queryParams"
                      type="textarea"
                      :rows="8"
                      placeholder='例如：{"scene":"stress-demo"}'
                      :disabled="running"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Request Body(JSON)">
                    <el-input
                      v-model="form.requestBody"
                      type="textarea"
                      :rows="8"
                      placeholder='例如：{"bizCode":"demo_load_test"}'
                      :disabled="running"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <div class="action-row">
              <el-button type="primary" size="large" :loading="running" @click="startTest">
                开始压测
              </el-button>
              <el-button size="large" :disabled="!running" @click="stopTest">
                停止
              </el-button>
            </div>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="14" class="stress-right-col">
        <el-row :gutter="16">
          <el-col :xs="12" :md="8" v-for="item in statCards" :key="item.label">
            <el-card class="metric-card" shadow="hover">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </el-card>
          </el-col>
        </el-row>

        <el-card class="panel-card result-card" shadow="hover">
          <template #header>
            <div class="panel-header">
              <span>实时日志</span>
              <el-tag :type="running ? 'success' : 'info'">
                {{ running ? "运行中" : "已停止" }}
              </el-tag>
            </div>
          </template>

          <el-table :data="logs" height="320" stripe>
            <el-table-column prop="time" label="时间" width="110" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.ok ? 'success' : 'danger'">
                  {{ row.ok ? "成功" : "失败" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="latency" label="耗时(ms)" width="110" />
            <el-table-column prop="message" label="消息" min-width="220" show-overflow-tooltip />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from "vue";
import { ElMessage } from "element-plus";
import { sendStressRequest } from "../../api/client";

function createInitialStats() {
  return {
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
}

function parseJsonObject(text, label) {
  if (!text || !String(text).trim()) {
    return {};
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`${label} 不是有效 JSON`);
  }

  if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error(`${label} 必须是 JSON 对象`);
  }

  return parsed;
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

const form = reactive({
  method: "post",
  requestUrl: "http://113.207.49.180:3030",
  queryParams: "{\n\n}",
  requestBody: "{\n\n}",
  concurrency: 10,
  rounds: 1,
  timeout: 5000
});

const stats = reactive(createInitialStats());
const logs = reactive([]);
const state = reactive({
  running: false,
  stopRequested: false
});

watch(
  () => form.requestUrl,
  (value) => {
    if (!value || !String(value).includes("?")) {
      return;
    }

    const [baseUrl, queryString] = String(value).split("?");
    if (!queryString) {
      return;
    }

    const searchParams = new URLSearchParams(queryString);
    const parsedQuery = {};

    searchParams.forEach((paramValue, key) => {
      parsedQuery[key] = paramValue;
    });

    form.requestUrl = baseUrl || "";
    form.queryParams = JSON.stringify(parsedQuery, null, 2);
  }
);

const running = computed(() => state.running);
const successRate = computed(() => {
  if (!stats.completed) {
    return 0;
  }
  return Number(((stats.success / stats.completed) * 100).toFixed(2));
});

const statCards = computed(() => [
  { label: "计划请求", value: stats.scheduled },
  { label: "已完成", value: stats.completed },
  { label: "成功率", value: `${successRate.value}%` },
  { label: "平均耗时", value: `${stats.avgLatency || 0} ms` },
  { label: "峰值耗时", value: `${stats.maxLatency || 0} ms` },
  { label: "总耗时", value: `${stats.elapsedMs || 0} ms` }
]);

function resetRuntimeState() {
  Object.assign(stats, createInitialStats());
  logs.splice(0, logs.length);
}

function recordResult(ok, latency, message) {
  stats.completed += 1;
  if (ok) {
    stats.success += 1;
  } else {
    stats.failed += 1;
  }

  if (stats.completed === 1) {
    stats.minLatency = latency;
    stats.maxLatency = latency;
    stats.avgLatency = latency;
  } else {
    stats.minLatency = Math.min(stats.minLatency, latency);
    stats.maxLatency = Math.max(stats.maxLatency, latency);
    const totalLatency = stats.avgLatency * (stats.completed - 1) + latency;
    stats.avgLatency = Number((totalLatency / stats.completed).toFixed(2));
  }

  const elapsed = Date.now() - stats.startedAt;
  stats.elapsedMs = elapsed;
  stats.qps = elapsed ? Number(((stats.completed * 1000) / elapsed).toFixed(2)) : 0;

  if (logs.length >= 200) {
    logs.pop();
  }

  logs.unshift({
    id: `${Date.now()}-${stats.completed}`,
    ok,
    latency,
    message,
    time: new Date().toLocaleTimeString("zh-CN", { hour12: false })
  });
}

function normalizeForm() {
  form.requestUrl = String(form.requestUrl || "").trim();
  form.method = String(form.method || "post").toLowerCase();
  form.concurrency = Math.max(1, Number(form.concurrency) || 1);
  form.rounds = Math.max(1, Number(form.rounds) || 1);
  form.timeout = Math.max(100, Number(form.timeout) || 5000);
}

async function startTest() {
  if (state.running) {
    return;
  }

  normalizeForm();

  try {
    const requestUrl = form.requestUrl;
    if (!requestUrl) {
      throw new Error("请求 URL 不能为空");
    }
    if (!/^https?:\/\//i.test(requestUrl)) {
      throw new Error("请求 URL 必须以 http:// 或 https:// 开头");
    }

    const customParams = parseJsonObject(form.queryParams, "Query Params");
    const customBody = parseJsonObject(form.requestBody, "Request Body");
    const totalTasks = Number(form.concurrency) * Number(form.rounds);
    const poolSize = clampConcurrency(form.concurrency, totalTasks);

    resetRuntimeState();
    state.running = true;
    state.stopRequested = false;
    stats.startedAt = Date.now();
    stats.scheduled = totalTasks;

    const tasks = Array.from({ length: totalTasks }, (_, index) => async () => {
      if (state.stopRequested) {
        return;
      }

      const controller = new AbortController();
      const startedAt = performance.now();

      try {
        await sendStressRequest(
          {
            timeout: Number(form.timeout),
            url: requestUrl,
            method: form.method,
            params: customParams,
            data: customBody
          },
          controller.signal
        );

        const latency = Number((performance.now() - startedAt).toFixed(2));
        recordResult(true, latency, `请求 ${index + 1} 成功`);
      } catch (error) {
        const latency = Number((performance.now() - startedAt).toFixed(2));
        recordResult(false, latency, error.response?.data?.message || error.message || `请求 ${index + 1} 失败`);
      }
    });

    await runPool(tasks, poolSize);
    ElMessage.success("压测执行完成");
  } catch (error) {
    ElMessage.error(error.message || "压测启动失败");
  } finally {
    stats.endedAt = Date.now();
    if (stats.startedAt) {
      stats.elapsedMs = stats.endedAt - stats.startedAt;
      stats.qps = stats.elapsedMs ? Number(((stats.completed * 1000) / stats.elapsedMs).toFixed(2)) : 0;
    }
    state.running = false;
  }
}

function stopTest() {
  state.stopRequested = true;
  ElMessage.warning("已请求停止，当前已发出的请求会继续收尾");
}
</script>
