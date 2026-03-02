#!/usr/bin/env node
import { createApp } from '../src/app.js'

createApp().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
