import { createSignal } from 'react-alien-signals'
import type { Theme } from '@penpot/plugin-types'
import { computed } from 'alien-signals'

export const theme$ = createSignal<Theme>('light')
export const isDark$ = computed(() => theme$() === 'dark')
