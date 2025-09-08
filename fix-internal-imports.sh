#!/bin/bash

echo "Fixing internal imports in package components..."

# Fix imports in components directory
find src/components -name "*.astro" -type f -exec sed -i '' \
  "s|from '@/components/|from './|g" {} \;

find src/components -name "*.astro" -type f -exec sed -i '' \
  "s|from '@/layouts/|from '../layouts/|g" {} \;

find src/components -name "*.astro" -type f -exec sed -i '' \
  "s|from '@/lib/|from '../utils/|g" {} \;

find src/components -name "*.astro" -type f -exec sed -i '' \
  "s|from '@/config/|from '../config/|g" {} \;

# Fix imports in layouts directory
find src/layouts -name "*.astro" -type f -exec sed -i '' \
  "s|from '@/components/|from '../components/|g" {} \;

find src/layouts -name "*.astro" -type f -exec sed -i '' \
  "s|from '@/lib/|from '../utils/|g" {} \;

find src/layouts -name "*.astro" -type f -exec sed -i '' \
  "s|from '@/config/|from '../config/|g" {} \;

echo "Import fixes complete!"