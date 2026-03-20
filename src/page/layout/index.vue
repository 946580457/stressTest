<template>
  <el-container class="app-shell">
    <Sidebar :active-path="route.path" />

    <el-container class="app-content">
      <Header :user-name="userName" />

      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import Header from "../header/index.vue";
import Sidebar from "../sidebar/index.vue";
import { useStore } from "vuex";

const route = useRoute();
const store = useStore();

const userName = computed(() => store.state.user.user?.name || "未登录");
</script>
