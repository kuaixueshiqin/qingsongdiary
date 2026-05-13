# 轻松书 APK 打包指南

这个项目已经是标准的 PWA 应用，有两种方法可以将其打包成 APK：

## 方法一：使用 PWA Builder（推荐，最简单）

### 在线打包（无需任何本地设置）
1. 访问 [PWA Builder](https://www.pwabuilder.com/)
2. 输入你的网站 URL（如果已部署）
3. 或者上传项目的 `dist` 文件夹内容到一个临时服务器
4. 选择打包为 Android App
5. 下载生成的 APK 文件

### 使用本地工具打包
```bash
# 安装 pwabuilder-cli
npm install -g @pwabuilder/cli

# 在项目根目录运行
cd /workspace
pwabuilder build android
```

## 方法二：使用本地 Android Studio（完整控制）

### 前置要求
1. 安装 [JDK 17+](https://adoptium.net/)
2. 安装 [Android Studio](https://developer.android.com/studio)
3. 配置 Android SDK（API 36）

### 本地构建步骤

```bash
# 1. 确保项目已构建（已经完成）
npm run build

# 2. 同步到 Android 项目（已经完成）
npx cap sync

# 3. 在 Android Studio 中打开项目
# 打开 /workspace/android 目录

# 4. 构建 APK
# 在 Android Studio 中: Build -> Build Bundle(s) / APK(s) -> Build APK(s)
```

## 方法三：使用 GitHub Actions 自动构建

创建 `.github/workflows/build-apk.yml` 文件，配置 CI/CD 自动构建。

## 当前项目状态

✅ 项目已配置为 PWA（带有 manifest.json）
✅ 使用 Capacitor 准备了 Android 项目
✅ 生产版本已构建（/workspace/dist）
✅ Android 项目已同步

## APK 文件位置

构建成功后，APK 文件通常位于：
- `android/app/build/outputs/apk/debug/app-debug.apk` (调试版本)
- `android/app/build/outputs/apk/release/app-release.apk` (发布版本)

## 推荐方案

**最简单的方案**：
1. 将 `/workspace/dist` 文件夹部署到任意静态托管（如 Vercel, Netlify, GitHub Pages）
2. 访问 [pwabuilder.com](https://www.pwabuilder.com/) 输入你的 URL
3. 点击 "Package for Stores" -> "Android"
4. 下载 APK 文件

**如果需要本地构建**：
在有 Android SDK 的机器上，进入 `/workspace/android` 目录运行：
```bash
./gradlew assembleDebug
```

## 应用配置

- 应用名称：轻松书
- 包名：com.qingsongshu.app
- 版本：1.0
- 最小 SDK：24 (Android 7.0)
- 目标 SDK：36 (Android 14)
