<template>
  <el-header class="app-header">
    <div class="header-left">
      <button class="menu-trigger" type="button" aria-label="menu" @click="toggleSidebar">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <div class="header-title-wrap">
        <p class="header-label">当前页面</p>
        <h1>{{ currentTitle }}</h1>
      </div>
    </div>

    <div class="header-actions">
      <el-dropdown>
        <span class="user-badge">
          {{ userName }}
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-header>
</template>

<script setup>
import { computed } from "vue";
import { ElMessage } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";

defineProps({
  userName: {
    type: String,
    default: "未登录"
  }
});

const route = useRoute();
const router = useRouter();
const store = useStore();

const currentTitle = computed(() => {
  if (route.path === "/stress") {
    return "单接口压力测试";
  }
  if (route.path === "/multi-api") {
    return "多接口编排执行";
  }
  return "系统概览";
});

function handleLogout() {
  store.dispatch("user/logout");
  ElMessage.success("已退出登录");
  router.push("/login");
}

function toggleSidebar() {
  store.dispatch("page/toggleSidebar");
}
</script>
