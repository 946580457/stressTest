import { createRouter, createWebHashHistory } from "vue-router";
import MainLayout from "../page/layout/index.vue";
import store from "../store";
import DashboardPage from "../views/dashboard-page/index.vue";
import LoginPage from "../page/login/index.vue";
import MultiApiPage from "../views/multi-api-page/index.vue";
import StressTestPage from "../views/stress-test-page/index.vue";

const routes = [
  {
    path: "/login",
    name: "login",
    component: LoginPage,
    meta: {
      guestOnly: true
    }
  },
  {
    path: "/",
    redirect: () => (store.getters["user/isAuthenticated"] ? "/wel" : "/login")
  },
  {
    path: "/",
    component: MainLayout,
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: "wel",
        name: "dashboard",
        component: DashboardPage
      },
      {
        path: "stress",
        name: "stress",
        component: StressTestPage
      },
      {
        path: "multi-api",
        name: "multi-api",
        component: MultiApiPage
      }
    ]
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

router.beforeEach((to) => {
  const isAuthenticated = store.getters["user/isAuthenticated"];

  if (to.meta.requiresAuth && !isAuthenticated) {
    return {
      path: "/login",
      query: {
        redirect: to.fullPath
      }
    };
  }

  if (to.meta.guestOnly && isAuthenticated) {
    return "/wel";
  }

  return true;
});

export default router;
