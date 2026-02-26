# iOS 测试指南

本文档详细说明了如何在 iOS 设备上测试 Chatbox 应用。

## 前提条件

### 系统要求
- **macOS** 系统（必需）
- **Xcode 14.0+** 从 App Store 安装
- **Node.js 22.7.0** （项目要求版本）
- **iOS 模拟器** 或 **iOS 真机**（iOS 13.0+）

### 开发工具安装

1. **安装 Xcode Command Line Tools**
   ```bash
   xcode-select --install
   ```

2. **验证 Xcode 安装**
   ```bash
   xcode-select -p
   # 应该输出: /Applications/Xcode.app/Contents/Developer
   ```

3. **检查 iOS 模拟器**
   - 打开 Xcode
   - 菜单栏选择 `Xcode > Open Developer Tool > Simulator`
   - 确保有可用的 iOS 模拟器

### 开发者账号（真机测试）
- **免费账号**: 可以在真机上测试 7 天
- **付费开发者账号**: 无限制真机测试和发布

## 项目准备

### 1. 安装依赖
```bash
npm install
```

### 2. 验证 Capacitor 配置
```bash
npx cap doctor
```

### 3. 生成应用图标（可选）
```bash
npm run mobile:assets
```

## iOS 测试步骤

### 方法一：一键构建并测试（推荐）

```bash
npm run mobile:ios
```

这个命令会自动执行以下步骤：
1. 清理构建目录
2. 构建移动端版本
3. 同步代码到 iOS 项目
4. 打开 Xcode

### 方法二：分步执行

#### 步骤 1: 构建并同步
```bash
npm run mobile:sync:ios
```

#### 步骤 2: 打开 Xcode
```bash
npx cap open ios
```

## 在 Xcode 中测试

### 1. 选择目标设备

**模拟器测试:**
- 在 Xcode 顶部选择设备下拉菜单
- 选择任意 iOS 模拟器（推荐 iPhone 14 或更新）

**真机测试:**
- 用 USB 连接 iOS 设备到 Mac
- 在设备上信任此电脑
- 在 Xcode 中选择你的设备

### 2. 配置开发者账号（真机测试必需）

1. 选择项目根节点
2. 在 "Signing & Capabilities" 标签页
3. 选择你的 Team（开发者账号）
4. 确保 Bundle Identifier 唯一

### 3. 运行应用

**方法 1: 使用快捷键**
```
Cmd + R
```

**方法 2: 点击运行按钮**
- 点击 Xcode 左上角的播放按钮 ▶️

### 4. 首次真机安装

如果是首次在真机上安装：
1. 应用安装后可能无法直接打开
2. 在 iOS 设备上：`设置 > 通用 > VPN与设备管理`
3. 找到你的开发者账号，点击"信任"

## 调试和日志

### 1. Xcode 控制台
- 在 Xcode 底部查看实时日志
- 使用 `console.log()` 输出调试信息

### 2. Safari Web Inspector（推荐）
1. 在 iOS 设备上：`设置 > Safari > 高级 > Web 检查器` 开启
2. 在 Mac 上打开 Safari
3. 菜单栏：`开发 > [你的设备名] > [应用名]`
4. 可以使用完整的开发者工具

### 3. Chrome DevTools
```bash
# 启动 Chrome 调试
npx cap run ios --livereload --external
```

## 常见问题解决

### 构建失败

**问题**: `Command PhaseScriptExecution failed`
```bash
# 清理并重新构建
npm run mobile:sync:ios
```

**问题**: 找不到开发者工具
```bash
sudo xcode-select --reset
```

### 设备连接问题

**问题**: 设备未显示在 Xcode 中
1. 检查 USB 连接
2. 重启 Xcode
3. 在设备上重新信任电脑

**问题**: 应用无法安装
1. 检查 iOS 版本兼容性（需要 iOS 13.0+）
2. 确保设备存储空间充足
3. 检查开发者证书是否有效

### 性能问题

**问题**: 应用运行缓慢
- 使用 Release 模式构建：
  ```bash
  npx cap build ios
  ```

**问题**: 热重载不工作
```bash
# 使用实时重载模式
npx cap run ios --livereload
```

## 测试检查清单

### 功能测试
- [ ] 应用启动正常
- [ ] 界面显示完整
- [ ] 网络请求正常
- [ ] 本地存储功能
- [ ] 分享功能
- [ ] 键盘交互
- [ ] 安全区域适配（刘海屏）

### 性能测试
- [ ] 启动时间 < 3秒
- [ ] 界面切换流畅
- [ ] 内存使用合理
- [ ] 电池消耗正常

### 兼容性测试
- [ ] 不同 iOS 版本
- [ ] 不同设备尺寸
- [ ] 横竖屏切换
- [ ] 深色/浅色模式

## 发布准备

### 1. 生产构建
```bash
# 构建生产版本
cross-env NODE_ENV=production npm run mobile:sync:ios
```

### 2. Archive 构建
1. 在 Xcode 中选择 "Any iOS Device"
2. 菜单栏：`Product > Archive`
3. 等待构建完成

### 3. 上传到 App Store Connect
1. 在 Organizer 中选择 Archive
2. 点击 "Distribute App"
3. 选择 "App Store Connect"
4. 按提示完成上传

## 有用的命令

```bash
# 查看 Capacitor 状态
npx cap doctor

# 清理 iOS 构建
npx cap clean ios

# 更新 Capacitor 插件
npx cap sync ios

# 查看可用设备
xcrun simctl list devices

# 重置模拟器
xcrun simctl erase all
```

## 参考资源

- [Capacitor iOS 官方文档](https://capacitorjs.com/docs/ios)
- [Xcode 用户指南](https://developer.apple.com/xcode/)
- [iOS 开发者文档](https://developer.apple.com/documentation/)

---

**注意**: 本文档基于 Capacitor 6.x 版本编写，如果项目升级请相应更新步骤。