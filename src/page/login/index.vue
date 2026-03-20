<template>
  <div class="login-page">
    <div class="login-panel">
      <div class="login-copy">
        <p class="eyebrow">Access Control</p>
        <h1>登录压力测试平台</h1>
        <p>
          登录后即可访问系统概览、压力测试页以及后续会扩展的报告与任务模块。
        </p>
      </div>

      <el-card class="login-card" shadow="hover">
        <template #header>
          <div class="panel-header">
            <span>账号登录</span>
            <el-tag type="info">Local Auth</el-tag>
          </div>
        </template>

        <el-form label-position="top" :model="form" @submit.prevent>
          <el-form-item label="用户名">
            <el-input v-model="form.username" placeholder="请输入用户名" />
          </el-form-item>

          <el-form-item label="密码">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              placeholder="请输入密码"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" size="large" class="login-button" @click="handleLogin">
              登录
            </el-button>
          </el-form-item>
        </el-form>

        <p class="login-tip">演示环境：任意用户名 + 至少 4 位密码即可进入。</p>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import { ElMessage } from "element-plus";

const router = useRouter();
const route = useRoute();
const store = useStore();

const form = reactive({
  username: "admin",
  password: "1234"
});

function handleLogin() {
  try {
    store.dispatch("user/login", form);
    ElMessage.success("登录成功");
    router.push(route.query.redirect || "/wel");
  } catch (error) {
    ElMessage.error(error.message || "登录失败");
  }
}
</script>
