<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { api } from "../lib/api";

type Status = "OPEN" | "IN_PROGRESS" | "DONE";
type Todo = {
  id: string;
  title: string;
  description?: string | null;
  status: Status;
  priority: number;
};

const props = defineProps<{ projectId: string }>();

const todos = ref<Todo[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// create form
const newTitle = ref("");
const newDesc = ref("");
const creating = ref(false);

// edit modal
const isEditOpen = ref(false);
const editId = ref<string | null>(null);
const editTitle = ref("");
const editDesc = ref("");
const saving = ref(false);

function sortTodos(list: Todo[]) {
  return [...list].sort((a, b) => {
    const pr = (b.priority ?? 0) - (a.priority ?? 0); // higher priority first
    if (pr !== 0) return pr;
    return a.title.localeCompare(b.title); // tie-breaker
  });
}

const openTodos = computed(() => sortTodos(todos.value.filter((t) => t.status === "OPEN")));
const inProgressTodos = computed(() => sortTodos(todos.value.filter((t) => t.status === "IN_PROGRESS")));
const doneTodos = computed(() => sortTodos(todos.value.filter((t) => t.status === "DONE")));

async function load() {
  error.value = null;
  loading.value = true;
  try {
    const res = await api.get(`/projects/${props.projectId}/todos`);
    todos.value = res.data;
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? "Failed to load todos";
  } finally {
    loading.value = false;
  }
}

async function createTodo() {
  if (!newTitle.value.trim()) return;
  creating.value = true;
  error.value = null;
  try {
    await api.post(`/projects/${props.projectId}/todos`, {
      title: newTitle.value.trim(),
      description: newDesc.value.trim() || undefined,
      priority: 1,
    });
    newTitle.value = "";
    newDesc.value = "";
    await load();
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? "Failed to create todo";
  } finally {
    creating.value = false;
  }
}

async function move(todo: Todo, status: Status) {
  error.value = null;
  try {
    await api.patch(`/todos/${todo.id}`, { status });
    await load();
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? "Failed to update todo";
  }
}

async function remove(todo: Todo) {
  error.value = null;
  try {
    await api.delete(`/todos/${todo.id}`);
    await load();
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? "Failed to delete todo";
  }
}

function openEdit(todo: Todo) {
  editId.value = todo.id;
  editTitle.value = todo.title ?? "";
  editDesc.value = todo.description ?? "";
  isEditOpen.value = true;
  error.value = null;
}

function closeEdit() {
  isEditOpen.value = false;
  editId.value = null;
  editTitle.value = "";
  editDesc.value = "";
}

async function saveEdit() {
  if (!editId.value) return;
  if (!editTitle.value.trim()) return;

  saving.value = true;
  error.value = null;
  try {
    await api.patch(`/todos/${editId.value}`, {
      title: editTitle.value.trim(),
      description: editDesc.value.trim() || null,
    });
    closeEdit();
    await load();
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? "Failed to save todo";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="space-y-4">
    <div class="rounded-xl border bg-white p-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold">Kanban</h1>
          <p class="mt-1 text-sm text-slate-600">Project: {{ projectId }}</p>

          <RouterLink to="/projects" class="mt-2 inline-block text-sm text-slate-600 hover:underline">
            ← Back to projects
          </RouterLink>
        </div>

        <span v-if="loading" class="text-sm text-slate-500">Loading...</span>
      </div>

      <div v-if="error" class="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {{ error }}
      </div>

      <div class="mt-4 grid gap-3 md:grid-cols-3">
        <input
          v-model="newTitle"
          placeholder="Todo title"
          class="rounded-md border px-3 py-2 md:col-span-1"
          @keyup.enter="createTodo"
        />

        <input
          v-model="newDesc"
          placeholder="Description (optional)"
          class="rounded-md border px-3 py-2 md:col-span-1"
          @keyup.enter="createTodo"
        />

        <button
          class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 md:col-span-1"
          :disabled="creating || !newTitle.trim()"
          @click="createTodo"
        >
          {{ creating ? "Adding..." : "Add Todo" }}
        </button>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <!-- OPEN -->
      <section class="rounded-xl border bg-white p-4">
        <h2 class="font-semibold">OPEN</h2>

        <div v-if="loading" class="mt-3 text-sm text-slate-600">Loading...</div>

        <div v-else class="mt-3 space-y-2">
          <div v-for="t in openTodos" :key="t.id" class="rounded-md border p-3">
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="font-medium">{{ t.title }}</div>
                <div v-if="t.description" class="mt-1 text-sm text-slate-600">{{ t.description }}</div>
              </div>

              <div class="flex items-center gap-3">
                <button class="text-sm text-slate-700 hover:underline" @click="openEdit(t)">Edit</button>
                <button class="text-sm text-red-600 hover:underline" @click="remove(t)">Delete</button>
              </div>
            </div>

            <div class="mt-3 flex gap-2">
              <button class="rounded-md border px-2 py-1 text-xs hover:bg-slate-50" @click="move(t, 'IN_PROGRESS')">
                → In Progress
              </button>
              <button class="rounded-md border px-2 py-1 text-xs hover:bg-slate-50" @click="move(t, 'DONE')">
                → Done
              </button>
            </div>
          </div>

          <p v-if="openTodos.length === 0" class="mt-3 text-sm text-slate-600">No OPEN todos.</p>
        </div>
      </section>

      <!-- IN_PROGRESS -->
      <section class="rounded-xl border bg-white p-4">
        <h2 class="font-semibold">IN PROGRESS</h2>

        <div v-if="loading" class="mt-3 text-sm text-slate-600">Loading...</div>

        <div v-else class="mt-3 space-y-2">
          <div v-for="t in inProgressTodos" :key="t.id" class="rounded-md border p-3">
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="font-medium">{{ t.title }}</div>
                <div v-if="t.description" class="mt-1 text-sm text-slate-600">{{ t.description }}</div>
              </div>

              <div class="flex items-center gap-3">
                <button class="text-sm text-slate-700 hover:underline" @click="openEdit(t)">Edit</button>
                <button class="text-sm text-red-600 hover:underline" @click="remove(t)">Delete</button>
              </div>
            </div>

            <div class="mt-3 flex gap-2">
              <button class="rounded-md border px-2 py-1 text-xs hover:bg-slate-50" @click="move(t, 'OPEN')">
                ← Open
              </button>
              <button class="rounded-md border px-2 py-1 text-xs hover:bg-slate-50" @click="move(t, 'DONE')">
                → Done
              </button>
            </div>
          </div>

          <p v-if="inProgressTodos.length === 0" class="mt-3 text-sm text-slate-600">No IN PROGRESS todos.</p>
        </div>
      </section>

      <!-- DONE -->
      <section class="rounded-xl border bg-white p-4">
        <h2 class="font-semibold">DONE</h2>

        <div v-if="loading" class="mt-3 text-sm text-slate-600">Loading...</div>

        <div v-else class="mt-3 space-y-2">
          <div v-for="t in doneTodos" :key="t.id" class="rounded-md border p-3">
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="font-medium">{{ t.title }}</div>
                <div v-if="t.description" class="mt-1 text-sm text-slate-600">{{ t.description }}</div>
              </div>

              <div class="flex items-center gap-3">
                <button class="text-sm text-slate-700 hover:underline" @click="openEdit(t)">Edit</button>
                <button class="text-sm text-red-600 hover:underline" @click="remove(t)">Delete</button>
              </div>
            </div>

            <div class="mt-3 flex gap-2">
              <button class="rounded-md border px-2 py-1 text-xs hover:bg-slate-50" @click="move(t, 'OPEN')">
                ← Open
              </button>
              <button class="rounded-md border px-2 py-1 text-xs hover:bg-slate-50" @click="move(t, 'IN_PROGRESS')">
                ← In Progress
              </button>
            </div>
          </div>

          <p v-if="doneTodos.length === 0" class="mt-3 text-sm text-slate-600">No DONE todos.</p>
        </div>
      </section>
    </div>

    <!-- EDIT MODAL -->
    <div v-if="isEditOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40" @click="closeEdit"></div>

      <div class="relative w-full max-w-lg rounded-xl border bg-white p-6 shadow-lg">
        <div class="flex items-start justify-between">
          <h3 class="text-lg font-semibold">Edit Todo</h3>
          <button class="text-slate-600 hover:text-slate-900" @click="closeEdit">✕</button>
        </div>

        <div class="mt-4 space-y-3">
          <div>
            <label class="text-sm text-slate-600">Title</label>
            <input
              v-model="editTitle"
              class="mt-1 w-full rounded-md border px-3 py-2"
              @keyup.enter="saveEdit"
            />
          </div>

          <div>
            <label class="text-sm text-slate-600">Description</label>
            <textarea v-model="editDesc" rows="4" class="mt-1 w-full rounded-md border px-3 py-2"></textarea>
          </div>
        </div>

        <div class="mt-5 flex justify-end gap-2">
          <button class="rounded-md border px-4 py-2 text-sm hover:bg-slate-50" @click="closeEdit">
            Cancel
          </button>
          <button
            class="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
            :disabled="saving || !editTitle.trim()"
            @click="saveEdit"
          >
            {{ saving ? "Saving..." : "Save" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>