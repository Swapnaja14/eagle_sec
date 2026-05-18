#!/bin/bash

echo "🧹 Cleaning Expo/Metro cache..."

# Kill any running Metro bundler
pkill -f "metro" || true
pkill -f "expo" || true

# Clear Metro bundler cache
rm -rf .expo
rm -rf node_modules/.cache
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-* 2>/dev/null || true
rm -rf $TMPDIR/react-* 2>/dev/null || true

echo "✅ Cache cleared!"
echo ""
echo "🚀 Starting Expo with clean cache..."
echo ""

npx expo start -c --web
