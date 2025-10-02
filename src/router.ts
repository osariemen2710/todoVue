import { createRouter, createWebHistory } from 'vue-router';
import TodoList from './components/TodoList.vue';
import TodoDetail from './components/TodoDetail.vue';
import TodoEdit from './components/TodoEdit.vue';

const routes = [
  { path: '/', name: 'TodoList', component: TodoList },
  { path: '/todo/:id', name: 'TodoDetail', component: TodoDetail, props: true },
  { path: '/todo/:id/edit', name: 'TodoEdit', component: TodoEdit, props: true },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
