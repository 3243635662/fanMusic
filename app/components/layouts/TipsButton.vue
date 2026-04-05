<template>
  <UTooltip :text="text" :prevent="!text">
    <button v-bind="$attrs" type="button" class="transition-all cursor-pointer outline-none flex items-center justify-center">
      <slot>
        <UIcon v-if="icon" :name="icon" :class="iconClass" />
      </slot>
    </button>
  </UTooltip>
</template>

<script lang="ts" setup>
defineOptions({ inheritAttrs: false })
withDefaults(defineProps<{
  text?: string;
  icon?: string;
  iconClass?: any;
}>(), {
  text: '',
});
</script>