<template>
  <el-aside :class="['app-sidebar', { 'is-collapsed': collapsed }]" :width="collapsed ? '72px' : '240px'">
    <div class="brand-block">
      <template v-if="collapsed">
        <h2 class="brand-mini">V3</h2>
      </template>
      <template v-else>
        <p class="brand-kicker">Stress Lab</p>
        <h2>Vue 3 压测平台</h2>
        <span>Vue Router + Vuex + Axios</span>
      </template>
    </div>

    <el-menu
      :default-active="activePath"
      class="nav-menu"
      :collapse="collapsed"
      router
      background-color="transparent"
      text-color="#dbeafe"
      active-text-color="#ffffff"
    >
      <el-sub-menu index="workspace">
        <template #title>
          <el-icon><Grid /></el-icon>
          <span>工作台</span>
        </template>

        <el-menu-item index="/wel" :title="collapsed ? '概览首页' : undefined">
          <el-icon><House /></el-icon>
          <span>概览首页</span>
        </el-menu-item>
        <el-menu-item index="/stress" :title="collapsed ? '单接口压力测试' : undefined">
          <el-icon><DataAnalysis /></el-icon>
          <span>单接口压力测试</span>
        </el-menu-item>
        <el-menu-item index="/multi-api" :title="collapsed ? '多接口编排' : undefined">
          <el-icon><Connection /></el-icon>
          <span>多接口编排</span>
        </el-menu-item>
      </el-sub-menu>
    </el-menu>
  </el-aside>
</template>

<script setup>
import { computed } from "vue";
import { Connection, DataAnalysis, Grid, House } from "@element-plus/icons-vue";
import { useStore } from "vuex";

const store = useStore();

defineProps({
  activePath: {
    type: String,
    default: "/wel"
  }
});

const collapsed = computed(() => store.state.page.sidebarCollapsed);
</script>
