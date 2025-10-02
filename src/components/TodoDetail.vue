<template>
  <div class="detail-box">
    <div v-if="todo">
      <h2 class="todo-title">{{ todo.title }}</h2>
      <p :class="['status', todo.completed ? 'completed' : 'incomplete']">
        Status: {{ todo.completed ? 'Completed' : 'Incomplete' }}
      </p>
      <div class="actions">
        <router-link :to="{ name: 'TodoEdit', params: { id } }" class="btn btn-primary">Edit</router-link>
        <router-link :to="{ name: 'TodoList' }" class="btn btn-secondary">Back to List</router-link>
      </div>
    </div>
    <div v-else>
      <p>Loading todo...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../lib/supabase';

const props = defineProps<{ id: string }>();
const todo = ref<any>(null);

onMounted(async () => {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('id', props.id)
    .single();
  if (error) {
    console.error('Error fetching todo', error);
  } else {
    todo.value = data;
  }
});
</script>

<style scoped>
.detail-box {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
.todo-title {
  font-size: 2.25rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
}
.status {
  display: inline-block;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  margin-bottom: 2rem;
}
.status.completed {
  background-color: #dcfce7; /* green-100 */
  color: #166534; /* green-800 */
}
.status.incomplete {
  background-color: #ffedd5; /* orange-100 */
  color: #9a3412; /* orange-800 */
}
.actions {
  display: flex;
  gap: 1rem;
}
</style>
