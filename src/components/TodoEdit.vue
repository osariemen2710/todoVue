<template>
  <div class="edit-box">
    <div v-if="todo">
      <h2>Edit Todo</h2>
      <form @submit.prevent="saveTodo">
        <div class="form-group">
          <label for="title">Title</label>
          <input id="title" type="text" v-model="todo.title" />
        </div>
        <div class="form-group">
          <label for="detail">Details</label>
          <textarea id="detail" v-model="todo.detail" rows="4"></textarea>
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="todo.completed" />
            <span>Completed</span>
          </label>
        </div>
        <div class="form-actions">
          <button type="submit" :disabled="saving" class="btn btn-primary">{{ saving ? 'Saving...' : 'Save Changes' }}</button>
          <router-link :to="{ name: 'TodoDetail', params: { id } }" class="btn btn-secondary">Cancel</router-link>
        </div>
      </form>
    </div>
    <div v-else>
      <p>Loading editor...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../lib/supabase';

const props = defineProps<{ id: string }>();
const router = useRouter();
const todo = ref<any>(null);
const saving = ref(false);

async function saveTodo() {
  if (!todo.value) return;
  saving.value = true;
  const { error } = await supabase
    .from('todos')
    .update({ title: todo.value.title, completed: todo.value.completed, detail: todo.value.detail ?? '' })
    .eq('id', props.id);
  saving.value = false;
  if (error) {
    console.error('Error updating todo', error);
  } else {
    router.push({ name: 'TodoDetail', params: { id: props.id } });
  }
}

onMounted(async () => {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('id', props.id)
    .single();
  if (error) {
    console.error('Error fetching todo for edit', error);
  } else {
    todo.value = data;
  }
});
</script>

<style scoped>
.edit-box {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
h2 {
  font-size: 2.25rem;
  font-weight: 700;
  margin: 0 0 1.5rem 0;
}
.form-group {
  margin-bottom: 1.5rem;
}
label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}
input[type="text"],
textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  border: 2px solid #e5e7eb;
  box-sizing: border-box;
  font-size: 1rem;
  transition: all 0.2s;
}
input[type="text"]:focus,
textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.checkbox-label {
  display: flex;
  align-items: center;
  font-weight: normal;
  cursor: pointer;
}
.checkbox-label input {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
  accent-color: #3b82f6;
  margin-right: 0.75rem;
}
.form-actions {
  margin-top: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}
</style>
