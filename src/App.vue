<template>
  <div class="container">
    <h1 class="text-2xl font-bold mb-4">Riemen's TodoVue</h1>
    <router-view />
  </div>
</template>

<script setup lang="ts">
// No longer importing TodoList directly, router handles it.
</script>

<style scoped>
.container {
  max-width: 48rem; /* max-w-3xl */
  margin-left: auto;
  margin-right: auto;
  padding: 1.5rem; /* p-6 */
}

@media (max-width: 640px) {
  .container {
    padding: 1rem; /* p-4 */
  }
}
</style>
