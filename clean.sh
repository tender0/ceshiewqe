#!/bin/bash

echo "🧹 开始清理项目..."
echo ""

# 清理 Rust 编译产物
if [ -d "src-tauri/target" ]; then
    echo "📦 清理 Rust 编译产物..."
    SIZE_BEFORE=$(du -sh src-tauri/target 2>/dev/null | cut -f1)
    rm -rf src-tauri/target
    echo "✅ 已清理 src-tauri/target (原大小: $SIZE_BEFORE)"
else
    echo "⏭️  src-tauri/target 不存在，跳过"
fi

echo ""

# 清理前端 Node.js 依赖
if [ -d "node_modules" ]; then
    echo "📦 清理前端依赖..."
    SIZE_BEFORE=$(du -sh node_modules 2>/dev/null | cut -f1)
    rm -rf node_modules
    echo "✅ 已清理 node_modules (原大小: $SIZE_BEFORE)"
else
    echo "⏭️  node_modules 不存在，跳过"
fi

echo ""

# 清理后端 Node.js 依赖
if [ -d "server/node_modules" ]; then
    echo "📦 清理后端依赖..."
    SIZE_BEFORE=$(du -sh server/node_modules 2>/dev/null | cut -f1)
    rm -rf server/node_modules
    echo "✅ 已清理 server/node_modules (原大小: $SIZE_BEFORE)"
else
    echo "⏭️  server/node_modules 不存在，跳过"
fi

echo ""

# 清理构建产物
if [ -d "dist" ]; then
    echo "📦 清理构建产物..."
    rm -rf dist
    echo "✅ 已清理 dist"
else
    echo "⏭️  dist 不存在，跳过"
fi

echo ""

# 清理日志文件
echo "📦 清理日志文件..."
LOG_COUNT=$(find . -name "*.log" -type f 2>/dev/null | wc -l | tr -d ' ')
if [ "$LOG_COUNT" -gt 0 ]; then
    find . -name "*.log" -type f -delete
    echo "✅ 已清理 $LOG_COUNT 个日志文件"
else
    echo "⏭️  没有找到日志文件"
fi

echo ""

# 清理 macOS 临时文件
echo "📦 清理系统临时文件..."
DS_COUNT=$(find . -name ".DS_Store" -type f 2>/dev/null | wc -l | tr -d ' ')
if [ "$DS_COUNT" -gt 0 ]; then
    find . -name ".DS_Store" -type f -delete
    echo "✅ 已清理 $DS_COUNT 个 .DS_Store 文件"
else
    echo "⏭️  没有找到 .DS_Store 文件"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 清理完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 显示清理后的大小
echo "📊 当前项目大小："
du -sh . 2>/dev/null

echo ""
echo "💡 下一步操作："
echo "  1. 重新安装前端依赖:  npm install"
echo "  2. 重新安装后端依赖:  cd server && npm install"
echo "  3. 开发时会自动编译:  npm run tauri dev"
echo ""
