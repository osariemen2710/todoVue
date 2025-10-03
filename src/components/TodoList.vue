<template>
  <div>
    <div v-if="!user" class="card auth-box">
      <h2>Sign In</h2>
      <p>Sign in via magic link with your email below.</p>
      <form @submit.prevent="signIn">
        <input class="form-input" v-model="email" type="email" placeholder="you@example.com" />
        <button type="submit" class="btn btn-primary" :disabled="authLoading" style="width: 100%; margin-top: 1rem;">
          {{ authLoading ? 'Sending...' : 'Send Magic Link' }}
        </button>
      </form>
      <p v-if="message" class="text-success text-center" style="margin-top: 1rem;">{{ message }}</p>
    </div>

    <div v-else>
      <div class="header">
        <h2>Your Todos</h2>
        <div class="user-actions">
          <span>{{ user.email }}</span>
          <button @click="signOut" class="btn btn-secondary">Sign out</button>
        </div>
      </div>

      <div class="new-todo card">
        <input v-model="newTitle" class="form-input" placeholder="Add a new todo..." @keyup.enter="addTodo" />
        <button @click="addTodo" :disabled="adding" class="btn btn-primary">{{ adding ? '...' : 'Add' }}</button>
      </div>

      <div class="search-bar">
        <input v-model="searchQuery" class="form-input" placeholder="Search..." />
      </div>

      <div class="filter-buttons">
        <button @click="setFilter('all')" :class="['btn', currentFilter === 'all' ? 'btn-primary' : 'btn-secondary']">All</button>
        <button @click="setFilter('completed')" :class="['btn', currentFilter === 'completed' ? 'btn-primary' : 'btn-secondary']">Completed</button>
        <button @click="setFilter('uncompleted')" :class="['btn', currentFilter === 'uncompleted' ? 'btn-primary' : 'btn-secondary']">Pending</button>
      </div>

      <div v-if="loading" class="text-center">Loading...</div>

      <div v-else-if="todos.length === 0" class="card no-todos-message">
        <h3>You're all caught up!</h3>
        <p>Add your first todo to get started.</p>
      </div>

      <ul v-else class="todos">
        <li v-for="t in todos" :key="t.id" class="todo-item card">
          <router-link :to="{ name: 'TodoDetail', params: { id: t.id } }" class="todo-link">
            <span :class="{ done: t.completed }">{{ t.title }}</span>
          </router-link>
          <button @click.stop.prevent="deleteTodo(t)" class="btn-danger">&times;</button>
        </li>
      </ul>

      <div v-if="totalPages > 1" class="pagination">
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <div class="pagination-buttons">
          <button @click="prevPage" :disabled="currentPage <= 1" class="btn btn-secondary">Prev</button>
          <button @click="nextPage" :disabled="currentPage >= totalPages" class="btn btn-secondary">Next</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// --- STATE ---
type Todo = {
  id: number;
  user_id: string;
  title: string;
  completed: boolean;
  detail?: string | null;
  inserted_at?: string;
};
type FilterStatus = 'all' | 'completed' | 'uncompleted';

const user = ref<any | null>(null);
const todos = ref<Todo[]>([]);
const loading = ref(false);
const adding = ref(false);
const authLoading = ref(false);
const email = ref('');
const message = ref('');
const newTitle = ref('');

const searchQuery = ref('');
const currentFilter = ref<FilterStatus>('all');
const currentPage = ref(1);
const todosPerPage = 8;
const totalTodos = ref(0);
const totalPages = ref(1);

let channel: any = null;

// --- DATA FETCHING ---
async function fetchSession() {
  const { data } = await supabase.auth.getSession();
  user.value = data.session?.user ?? null;
}

async function fetchTodos() {
  if (!user.value) return;
  loading.value = true;

  const from = (currentPage.value - 1) * todosPerPage;
  const to = currentPage.value * todosPerPage - 1;

  let query = supabase
    .from('todos')
    .select('*', { count: 'exact' })
    .eq('user_id', user.value.id)
    .order('inserted_at', { ascending: false })
    .range(from, to);

  if (searchQuery.value) {
    query = query.ilike('title', `%${searchQuery.value}%`);
  }

  if (currentFilter.value === 'completed') {
    query = query.eq('completed', true);
  } else if (currentFilter.value === 'uncompleted') {
    query = query.eq('completed', false);
  }

  const { data, error, count } = await query;

  loading.value = false;
  if (error) {
    console.error('Error fetching todos', error);
    return;
  }

  todos.value = data ?? [];
  totalTodos.value = count ?? 0;
  totalPages.value = Math.ceil(totalTodos.value / todosPerPage);
}

// --- REALTIME ---
function setupRealtime() {
  if (!user.value) return;
  if (channel) channel.unsubscribe();

  channel = supabase
    .channel('public:todos')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'todos', filter: `user_id=eq.${user.value.id}` },
      () => { fetchTodos(); }
    )
    .subscribe();
}

// --- ACTIONS ---
function setFilter(filter: FilterStatus) {
  currentFilter.value = filter;
  currentPage.value = 1;
  fetchTodos();
}

async function addTodo() {
  if (!user.value || !newTitle.value.trim()) return;
  adding.value = true;
  const { error } = await supabase.from('todos').insert({ user_id: user.value.id, title: newTitle.value.trim(), completed: false });
  adding.value = false;
  if (error) {
    console.error('Insert error', error);
  } else {
    newTitle.value = '';
  }
}

async function deleteTodo(t: Todo) {
  const { error } = await supabase.from('todos').delete().eq('id', t.id);
  if (error) {
    console.error('Delete error', error);
    return;
  }

  if (todos.value.length === 1 && currentPage.value > 1) {
    currentPage.value--;
  }

  fetchTodos();
}

async function signIn() {
  if (!email.value) return;
  authLoading.value = true;
  const { error } = await supabase.auth.signInWithOtp({ email: email.value });
  authLoading.value = false;
  if (error) {
    message.value = error.message;
  } else {
    message.value = 'Check your email for the magic link!';
  }
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Error signing out:', error);
}

// --- PAGINATION ---
function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchTodos();
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchTodos();
  }
}

// --- LIFECYCLE ---
onMounted(async () => {
  if (!isSupabaseConfigured) {
    message.value = 'Supabase is not configured.';
    return;
  }
  await fetchSession();
  
  const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
    const isInitialLoad = !user.value;
    user.value = session?.user ?? null;
    if (user.value && isInitialLoad) {
      await fetchTodos();
      setupRealtime();
    }
  });

  if (user.value) {
    await fetchTodos();
    setupRealtime();
  }

  onBeforeUnmount(() => {
    sub.subscription.unsubscribe();
    if (channel) channel.unsubscribe();
  });
});

let searchTimeout: ReturnType<typeof setTimeout>;
watch(searchQuery, () => {
  currentPage.value = 1;
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchTodos();
  }, 300);
});
</script>

<style scoped>
.auth-box { max-width: 400px; margin: 2rem auto; }
.header { display:flex; justify-content: space-between; align-items:center; margin-bottom: 1.5rem;}
.header h2 { margin: 0; }
.user-actions { display:flex; gap:0.5rem; align-items:center; }

.new-todo { display:flex; gap:0.5rem; margin-bottom: 1.5rem; padding: 1rem; }
.new-todo .form-input { flex-grow: 1; }

.search-bar { margin-bottom: 1.5rem; }

.filter-buttons {
  margin-bottom: 1.5rem;
  display: flex;
  gap: 0.5rem;
}

.no-todos-message { text-align: center; padding: 3rem 1rem; }
.no-todos-message h3 { margin: 0 0 0.5rem 0; }

.todos { list-style: none; padding: 0; margin: 0; }
.todo-item { 
  display:flex; 
  justify-content: space-between; 
  align-items:center; 
  padding: 1rem; 
  margin-bottom: 0.75rem;
  transition: all 0.2s;
}
.todo-item:hover { transform: translateY(-2px); box-shadow: 0 4px 20px -5px rgba(0,0,0,0.15); }

.todo-link {
  color: inherit;
  text-decoration: none;
  flex-grow: 1;
  display: flex;
  align-items: center;
}
.todo-link .done { text-decoration: line-through; color:#9ca3af; }

.btn-danger {
  background: transparent;
  border: none;
  color: #ef4444;
  font-size: 1.5rem;
  font-weight: 600;
  padding: 0 0.5rem;
  opacity: 0.5;
}
.btn-danger:hover { opacity: 1; }

.pagination {
  margin-top: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pagination-buttons { display: flex; gap: 0.5rem; }

@media (max-width: 640px) {
  .header { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
  .user-actions { width: 100%; justify-content: space-between; }
}
</style>