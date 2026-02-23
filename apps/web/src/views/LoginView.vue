<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../lib/api";
import { setToken } from "../lib/auth";

const router = useRouter();
const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref<string | null>(null);

async function submit() {
  error.value = null;
  loading.value = true;
  try {
    const res = await api.post("/auth/login", { email: email.value, password: password.value });
    setToken(res.data.accessToken);
    router.push("/projects");
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? "Login failed";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-md rounded-xl border bg-white p-6">
    <h1 class="text-xl font-semibold">Login</h1>

    <div v-if="error" class="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {{ error }}
    </div>

    <form class="mt-4 space-y-3" @submit.prevent="submit">
      <div>
        <label class="text-sm text-slate-600">Email</label>
        <input v-model="email" type="email" class="mt-1 w-full rounded-md border px-3 py-2" />
      </div>

      <div>
        <label class="text-sm text-slate-600">Password</label>
        <input v-model="password" type="password" class="mt-1 w-full rounded-md border px-3 py-2" />
      </div>

      <button
        class="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        :disabled="loading"
      >
        {{ loading ? "Signing in..." : "Login" }}
      </button>

      <RouterLink class="block text-center text-sm text-slate-600 hover:underline" to="/register">
        Create account
      </RouterLink>
    </form>
  </div>
</template>