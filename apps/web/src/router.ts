import { createRouter, createWebHistory } from "vue-router";
import { isAuthed } from "./lib/auth";

import LoginView from "./views/LoginView.vue";
import RegisterView from "./views/RegisterView.vue";
import ProjectsView from "./views/ProjectsView.vue";
import ProjectTodosView from "./views/ProjectTodosView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/projects" },
    { path: "/login", component: LoginView },
    { path: "/register", component: RegisterView },
    { path: "/projects", component: ProjectsView, meta: { requiresAuth: true } },
    {
      path: "/projects/:projectId",
      component: ProjectTodosView,
      props: true,
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isAuthed()) return "/login";
  if ((to.path === "/login" || to.path === "/register") && isAuthed()) return "/projects";
});

export default router;