#!/bin/bash
find src -name "*.tsx" -type f -exec sed -i \
  -e 's/bg-\[#050505\]/bg-\[var(--bg-main)\]/g' \
  -e 's/bg-\[#0a0a0a\]/bg-\[var(--bg-card)\]/g' \
  -e 's/bg-\[#111\]/bg-\[var(--bg-input)\]/g' \
  -e 's/text-\[#e5e5e5\]/text-\[var(--text-main)\]/g' \
  -e 's/text-\[#C0C0C0\]/text-\[var(--accent)\]/g' \
  -e 's/bg-\[#C0C0C0\]/bg-\[var(--accent)\]/g' \
  -e 's/border-white\/10/border-\[var(--border-color)\]/g' \
  -e 's/border-white\/20/border-\[var(--border-hover)\]/g' \
  -e 's/text-[#222]/text-\[var(--text-dark)\]/g' \
  -e 's/bg-[#222]/bg-\[var(--bg-dark)\]/g' \
  {} +
