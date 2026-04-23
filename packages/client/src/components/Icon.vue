<template>
  <component
    :is="ICONS[name]"
    class="icon"
    :role="label ? 'img' : 'presentation'"
    :aria-label="label ?? undefined"
    :aria-hidden="label ? undefined : true"
  />
</template>

<script setup lang="ts">
  import { ICONS, type IconName } from '~client/utils/icons'

  defineProps<{
    name: IconName
    /** If set, exposes the icon to assistive tech as an image with this label.
     *  Otherwise the icon is treated as decorative. */
    label?: string
  }>()
</script>

<style lang="scss" scoped>
  .icon {
    display: inline-block;
    width: 1.25em;
    height: 1.25em;
    vertical-align: -0.3em;
    fill: currentColor;
    flex-shrink: 0;
    overflow: visible;
    shape-rendering: crispEdges;
  }
</style>
