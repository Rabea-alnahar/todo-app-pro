<script setup lang="ts">
import { clearToken, isAuthed } from "./lib/auth";
import { computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const authed = computed(() => isAuthed());

function logout() {
  clearToken();
  router.replace("/login");
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <header class="border-b bg-white">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div class="font-semibold">Todo App</div>
        <nav class="flex items-center gap-3">
          <RouterLink class="text-sm hover:underline" to="/projects">Projects</RouterLink>

          <button
            v-if="authed"
            class="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-100"
            @click="logout"
          >
            Logout
          </button>

          <RouterLink v-else class="text-sm hover:underline" to="/login">Login</RouterLink>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-6">
      <RouterView />
    </main>
  </div>
</template>