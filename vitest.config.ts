/// <reference types="vitest" />
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        /* The test/experimental folder is broken stuff we don't want
         * to include in normal test runs, so we exclude it here. */
        exclude: [...configDefaults.exclude, 'test/experimental'],
    },
})
