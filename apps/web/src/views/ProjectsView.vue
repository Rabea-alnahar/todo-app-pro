<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api } from "../lib/api";
import { useRouter } from "vue-router";

type Project = { id: string; name: string };

const router = useRouter();
const projects = ref<Project[]>([]);
const name = ref("");
const loading = ref(false);
const error = ref<string | null>(null);

async function load() {
  error.value = null;
  loading.value = true;
  try {
    const res = await api.get("/projects");
    projects.value = res.data;
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? "Failed to load projects";
  } finally {
    loading.value = false;
  }
}

async function createProject() {
  if (!name.value.trim()) return;
  try {
    await api.post("/projects", { name: name.value.trim() });
    name.value = "";
    await load();
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? "Failed to create project";
  }
}

function openProject(p: Project) {
  router.push(`/projects/${p.id}`);
}

onMounted(load);
</script>

<template>
  <div class="space-y-4">
    <div class="rounded-xl border bg-white p-6">
      <h1 class="text-xl font-semibold">Projects</h1>

      <div v-if="error" class="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {{ error }}
      </div>

      <div class="mt-4 flex gap-2">
        <input v-model="name" placeholder="New project name" class="w-full rounded-md border px-3 py-2" />
        <button class="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800" @click="createProject">
          Add
        </button>
      </div>
    </div>

    <div class="rounded-xl border bg-white p-6">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold">Your projects</h2>
        <span v-if="loading" class="text-sm text-slate-500">Loading...</span>
      </div>

      <ul class="mt-3 divide-y">
        <li
          v-for="p in projects"
          :key="p.id"
          class="cursor-pointer py-3 hover:bg-slate-50 px-2 rounded-md"
          @click="openProject(p)"
        >
          {{ p.name }}
        </li>
      </ul>

      <p v-if="!loading && projects.length === 0" class="mt-3 text-sm text-slate-600">
        No projects yet.
      </p>
    </div>
  </div>
</template>