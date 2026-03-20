import { createStore } from "vuex";
import common from "./modules/common";
import page from "./modules/page";
import user from "./modules/user";

export default createStore({
  modules: {
    user,
    common,
    page
  }
});
