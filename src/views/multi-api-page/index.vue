<template>
  <div class="multi-api-page">
    <section class="hero">
      <div>
        <p class="eyebrow">Multi API Flow</p>
        <h2>多接口编排执行台</h2>
        <p class="hero-copy">
          面向接口联调与串行验证场景，支持配置多个接口步骤，并在步骤之间插入等待时间；可通过线程数并发执行多条完整流程链路。
        </p>
      </div>
      <div class="hero-badge">
        <span>线程数</span>
        <strong>{{ flow.threads }}</strong>
      </div>
    </section>

    <el-row :gutter="20" class="content-grid multi-api-layout-row">
      <el-col :xs="24" :lg="11" class="multi-api-left-col">
        <el-card class="panel-card multi-api-config-card" shadow="hover">
          <template #header>
            <div class="panel-header">
              <span>编排配置</span>
              <el-tag type="success">流程并发</el-tag>
            </div>
          </template>

          <el-form label-position="top">
            <el-row :gutter="12">
              <el-col :span="8">
                <el-form-item label="执行轮次">
                  <el-input-number v-model="flow.rounds" :min="1" :max="1000" :step="1" class="full-input" :disabled="running" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="线程数">
                  <el-input-number v-model="flow.threads" :min="1" :max="200" :step="1" class="full-input" :disabled="running" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="默认超时(ms)">
                  <el-input-number v-model="flow.timeout" :min="100" :max="60000" :step="100" class="full-input" :disabled="running" />
                </el-form-item>
              </el-col>
            </el-row>

            <div class="multi-api-toolbar">
              <div class="advanced-title">接口步骤</div>
              <el-button type="primary" plain :disabled="running" @click="addStep">新增接口</el-button>
            </div>

            <div class="multi-api-step-list">
              <el-card
                v-for="(step, index) in flow.steps"
                :key="step.id"
                class="multi-api-step-card"
                shadow="never"
              >
                <template #header>
                  <div class="panel-header">
                    <span>步骤 {{ index + 1 }}</span>
                    <el-button link type="danger" :disabled="running || flow.steps.length === 1" @click="removeStep(step.id)">
                      删除
                    </el-button>
                  </div>
                </template>

                <el-row :gutter="12">
                  <el-col :span="8">
                    <el-form-item label="名称">
                      <el-input v-model="step.name" placeholder="例如：查询用户" :disabled="running" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="方法">
                      <el-select v-model="step.method" class="full-input" :disabled="running">
                        <el-option label="GET" value="get" />
                        <el-option label="POST" value="post" />
                        <el-option label="PUT" value="put" />
                        <el-option label="DELETE" value="delete" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="步骤后等待(ms)">
                      <el-input-number v-model="step.waitMs" :min="0" :max="60000" :step="100" class="full-input" :disabled="running" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item label="请求 URL">
                      <el-input
                        v-model="step.url"
                        placeholder="例如：http://113.207.49.180:3030/api/demo"
                        :disabled="running"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="Query Params(JSON)">
                      <el-input v-model="step.queryParams" type="textarea" :rows="5" placeholder='例如：{"id":"1"}' :disabled="running" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="Request Body(JSON)">
                      <el-input v-model="step.requestBody" type="textarea" :rows="5" placeholder='例如：{"name":"demo"}' :disabled="running" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-card>
            </div>

            <div class="action-row">
              <el-button type="primary" size="large" :loading="running" @click="startFlow">
                开始执行
              </el-button>
              <el-button size="large" :disabled="!running" @click="stopFlow">
                停止
              </el-button>
            </div>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="13" class="multi-api-right-col">
        <el-row :gutter="16">
          <el-col :xs="12" :md="8" v-for="item in statCards" :key="item.label">
            <el-card class="metric-card" shadow="hover">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </el-card>
          </el-col>
        </el-row>

        <el-card class="panel-card result-card multi-api-result-card" shadow="hover">
          <template #header>
            <div class="panel-header">
              <span>执行日志</span>
              <el-tag :type="running ? 'success' : 'info'">
                {{ running ? "运行中" : "已停止" }}
              </el-tag>
            </div>
          </template>

          <el-table :data="logs" height="420" stripe>
            <el-table-column prop="time" label="时间" width="100" />
            <el-table-column prop="threadName" label="线程" width="90" />
            <el-table-column prop="stepName" label="步骤" width="120" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.ok ? 'success' : row.status === 'WAIT' ? 'warning' : 'danger'">
                  {{ row.status }}
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
import { computed, reactive } from "vue";
import { ElMessage } from "element-plus";
import { sendStressRequest } from "../../api/client";

function createStep() {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name: "接口步骤",
    method: "post",
    url: "http://113.207.49.180:3030",
    queryParams: "{\n\n}",
    requestBody: "{\n\n}",
    waitMs: 0
  };
}

function createInitialStats() {
  return {
    total: 0,
    completed: 0,
    success: 0,
    failed: 0,
    avgLatency: 0,
    totalWaitMs: 0
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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

const flow = reactive({
  rounds: 1,
  threads: 2,
  timeout: 5000,
  steps: [createStep()]
});

const state = reactive({
  running: false,
  stopRequested: false
});

const stats = reactive(createInitialStats());
const logs = reactive([]);

const running = computed(() => state.running);
const successRate = computed(() => {
  if (!stats.completed) {
    return 0;
  }
  return Number(((stats.success / stats.completed) * 100).toFixed(2));
});

const statCards = computed(() => [
  { label: "计划请求", value: stats.total },
  { label: "已完成", value: stats.completed },
  { label: "成功率", value: `${successRate.value}%` },
  { label: "平均耗时", value: `${stats.avgLatency || 0} ms` },
  { label: "累计等待", value: `${stats.totalWaitMs || 0} ms` },
  { label: "失败数", value: stats.failed }
]);

function addStep() {
  flow.steps.push(createStep());
}

function removeStep(id) {
  if (flow.steps.length === 1) {
    return;
  }
  const next = flow.steps.filter((step) => step.id !== id);
  flow.steps.splice(0, flow.steps.length, ...next);
}

function resetRuntimeState() {
  Object.assign(stats, createInitialStats());
  logs.splice(0, logs.length);
}

function pushLog(payload) {
  if (logs.length >= 200) {
    logs.pop();
  }
  logs.unshift({
    id: `${Date.now()}-${Math.random()}`,
    time: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
    ...payload
  });
}

function recordRequest(ok, latency) {
  stats.completed += 1;
  if (ok) {
    stats.success += 1;
  } else {
    stats.failed += 1;
  }

  if (stats.completed === 1) {
    stats.avgLatency = latency;
  } else {
    const totalLatency = stats.avgLatency * (stats.completed - 1) + latency;
    stats.avgLatency = Number((totalLatency / stats.completed).toFixed(2));
  }
}

function normalizeFlow() {
  flow.rounds = Math.max(1, Number(flow.rounds) || 1);
  flow.threads = Math.max(1, Number(flow.threads) || 1);
  flow.timeout = Math.max(100, Number(flow.timeout) || 5000);
  flow.steps.forEach((step, index) => {
    step.name = String(step.name || `步骤 ${index + 1}`).trim() || `步骤 ${index + 1}`;
    step.url = String(step.url || "").trim();
    step.waitMs = Math.max(0, Number(step.waitMs) || 0);
    step.method = String(step.method || "post").toLowerCase();
  });
}

async function executeOneFlow(threadIndex) {
  for (let round = 1; round <= flow.rounds; round += 1) {
    for (let index = 0; index < flow.steps.length; index += 1) {
      if (state.stopRequested) {
        return;
      }

      const step = flow.steps[index];
      const params = parseJsonObject(step.queryParams, `${step.name} Query Params`);
      const data = parseJsonObject(step.requestBody, `${step.name} Request Body`);
      const startedAt = performance.now();
      const threadName = `T${threadIndex + 1}`;

      try {
        await sendStressRequest({
          url: step.url,
          method: step.method,
          timeout: flow.timeout,
          params,
          data
        });

        const latency = Number((performance.now() - startedAt).toFixed(2));
        recordRequest(true, latency);
        pushLog({
          threadName,
          stepName: step.name,
          status: "成功",
          ok: true,
          latency,
          message: `第 ${round} 轮执行成功`
        });
      } catch (error) {
        const latency = Number((performance.now() - startedAt).toFixed(2));
        recordRequest(false, latency);
        pushLog({
          threadName,
          stepName: step.name,
          status: "失败",
          ok: false,
          latency,
          message: error.response?.data?.message || error.message || "请求失败"
        });
      }

      if (state.stopRequested) {
        return;
      }

      if (step.waitMs > 0 && (round !== flow.rounds || index !== flow.steps.length - 1)) {
        stats.totalWaitMs += step.waitMs;
        pushLog({
          threadName,
          stepName: step.name,
          status: "WAIT",
          ok: false,
          latency: step.waitMs,
          message: `等待 ${step.waitMs} ms 后执行下一步`
        });
        await wait(step.waitMs);
      }
    }
  }
}

async function startFlow() {
  if (state.running) {
    return;
  }

  normalizeFlow();

  try {
    flow.steps.forEach((step, index) => {
      if (!/^https?:\/\//i.test(step.url)) {
        throw new Error(`步骤 ${index + 1} 的请求 URL 必须以 http:// 或 https:// 开头`);
      }
      parseJsonObject(step.queryParams, `步骤 ${index + 1} Query Params`);
      parseJsonObject(step.requestBody, `步骤 ${index + 1} Request Body`);
    });

    resetRuntimeState();
    state.running = true;
    state.stopRequested = false;
    stats.total = flow.rounds * flow.steps.length * flow.threads;

    const tasks = Array.from({ length: flow.threads }, (_, index) => () => executeOneFlow(index));
    await runPool(tasks, flow.threads);

    ElMessage.success("多接口执行完成");
  } catch (error) {
    ElMessage.error(error.message || "执行失败");
  } finally {
    state.running = false;
  }
}

function stopFlow() {
  state.stopRequested = true;
  ElMessage.warning("已请求停止，当前执行中的接口会先收尾");
}
</script>
