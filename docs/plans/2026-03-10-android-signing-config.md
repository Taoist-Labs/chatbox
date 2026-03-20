# Android Signing Config Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 Capacitor Android 工程增加可选的命令行 release 签名配置，并提供本地 keystore 配置示例与忽略规则。

**Architecture:** 在 `android/app/build.gradle` 中按需读取 `android/keystore.properties`；存在且完整时为 `release` 构建绑定签名配置，不存在时保持当前行为不变。补充 `android-keystore.properties.example` 作为模板，并在仓库忽略真实 keystore 与本地签名配置文件。

**Tech Stack:** Gradle Groovy DSL、Android App Bundle / APK、Capacitor Android、Git ignore

### Task 1: 添加失败前检查

**Files:**
- Modify: `android/app/build.gradle`

**Step 1: 运行失败前检查**

Run: `rg -n "signingConfigs|keystoreProperties|storeFile" android/app/build.gradle`
Expected: 无匹配，说明尚未支持命令行签名配置。

**Step 2: 写最小实现**

在 `android/app/build.gradle` 中：
- 读取 `../keystore.properties`
- 判断属性是否完整
- 创建 `signingConfigs.release`
- 在 `buildTypes.release` 中按条件引用

**Step 3: 运行检查验证实现生效**

Run: `rg -n "signingConfigs|keystoreProperties|storeFile" android/app/build.gradle`
Expected: 出现新增配置字段。

### Task 2: 提供本地配置模板

**Files:**
- Create: `android-keystore.properties.example`

**Step 1: 添加示例配置**

内容包含：
- `storeFile`
- `storePassword`
- `keyAlias`
- `keyPassword`

**Step 2: 检查模板存在**

Run: `test -f android-keystore.properties.example`
Expected: 退出码 0。

### Task 3: 忽略真实密钥文件

**Files:**
- Modify: `.gitignore`

**Step 1: 添加忽略项**

加入：
- `android/keystore.properties`
- `*.jks`
- `*.keystore`

**Step 2: 检查忽略项存在**

Run: `rg -n "android/keystore.properties|\*\.jks|\*\.keystore" .gitignore`
Expected: 能匹配到新增规则。

### Task 4: 验证命令行打包入口

**Files:**
- Modify: `package.json`

**Step 1: 添加便捷脚本**

加入：
- `mobile:bundle:release`
- `mobile:apk:release`

**Step 2: 验证脚本存在**

Run: `node -e "const s=require('./package.json').scripts; console.log(s['mobile:bundle:release']); console.log(s['mobile:apk:release'])"`
Expected: 打印两个脚本命令。
