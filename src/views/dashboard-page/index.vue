<template>
  <div class="dashboard-page">
    <section class="hero">
      <div>
        <p class="eyebrow">System Overview</p>
        <h2>压测系统首页</h2>
        <p class="hero-copy">
          现在已经页面化，可以从概览页进入压测页，后续也方便继续加报告中心、历史记录和多环境配置。
        </p>
      </div>
      <div class="hero-badge">
        <span>路由状态</span>
        <strong>2 Pages</strong>
      </div>
    </section>

    <el-row :gutter="20">
      <el-col :xs="24" :md="8" v-for="item in cards" :key="item.title">
        <el-card class="metric-card dashboard-card" shadow="hover">
          <span>{{ item.title }}</span>
          <strong>{{ item.value }}</strong>
          <p class="dashboard-copy">{{ item.desc }}</p>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="panel-card dashboard-panel" shadow="hover">
      <template #header>
        <div class="panel-header">
          <span>快速入口</span>
          <el-tag>Ready</el-tag>
        </div>
      </template>

      <p class="dashboard-copy">
        当前项目已经具备基础页面化结构，压测能力位于独立路由页中。
      </p>

      <el-button type="primary" size="large" @click="goStress">
        进入压力测试页
      </el-button>
    </el-card>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const cards = [
  {
    title: "技术栈",
    value: "Vue 3",
    desc: "已集成 Vue Router、Vuex、Axios 和 Element Plus。"
  },
  {
    title: "核心能力",
    value: "压力测试",
    desc: "面向接口压测与调试场景，支持自定义请求 URL、Query Params、Request Body，并可配置线程数、循环次数与实时结果统计。"
  },
  {
    title: "扩展方向",
    value: "页面化",
    desc: "适合继续拆分历史记录、报表分析、接口配置页。"
  }
];

function goStress() {
  router.push("/stress");
}
</script>
