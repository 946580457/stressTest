export default {
  namespaced: true,
  state: () => ({
    sidebarCollapsed: false
  }),
  mutations: {
    setSidebarCollapsed(state, value) {
      state.sidebarCollapsed = value;
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    }
  },
  actions: {
    toggleSidebar({ commit }) {
      commit("toggleSidebar");
    }
  }
};
