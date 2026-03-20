function createInitialState() {
  const savedUser = localStorage.getItem("stress-demo-user");
  const user = savedUser ? JSON.parse(savedUser) : null;

  return {
    user,
    token: user ? "local-session-token" : ""
  };
}

export default {
  namespaced: true,
  state: createInitialState(),
  getters: {
    isAuthenticated(state) {
      return Boolean(state.token && state.user);
    }
  },
  mutations: {
    setAuth(state, payload) {
      state.user = payload.user;
      state.token = payload.token;
      localStorage.setItem("stress-demo-user", JSON.stringify(payload.user));
    },
    clearAuth(state) {
      state.user = null;
      state.token = "";
      localStorage.removeItem("stress-demo-user");
    }
  },
  actions: {
    login({ commit }, payload) {
      const { username, password } = payload;

      if (!username || !password) {
        throw new Error("请输入用户名和密码");
      }

      if (password.length < 4) {
        throw new Error("密码长度至少 4 位");
      }

      commit("setAuth", {
        user: {
          name: username,
          role: "tester"
        },
        token: "local-session-token"
      });
    },
    logout({ commit }) {
      commit("clearAuth");
    }
  }
};
