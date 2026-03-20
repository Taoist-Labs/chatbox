# iOS AI聊天工具上架差异化材料清单（中国大陆 vs 海外）

更新时间：2026-03-07  
适用范围：iOS App Store 公开分发（非企业私有分发）

## 0. 先确认分发策略

- 默认可用同一个 App 记录，在 `Pricing and Availability` 选择中国大陆与海外国家/地区。
- 仅当中国大陆与海外存在明显差异（主体不同、功能不同、数据路径不同、政策要求不同）时，才建议拆成双 `Bundle ID`。

## 1. 通用必备材料（两边都要）

| 材料                 | 说明                                                       | 提交位置                                |
| -------------------- | ---------------------------------------------------------- | --------------------------------------- |
| App 基础元数据       | 名称/副标题/描述/关键词/截图/预览视频/分类                 | App Store Connect -> App 信息与版本信息 |
| 隐私政策 URL         | iOS 必填                                                   | App Store Connect -> App Privacy        |
| App 隐私问卷         | 需覆盖你自己和第三方 SDK 的数据收集/用途                   | App Store Connect -> App Privacy        |
| 审核账号与审核说明   | 需提供可登录测试账号、可复现路径、后端可访问               | App Store Connect -> App Review Notes   |
| 加密出口合规材料     | 聊天 App 通常涉及 HTTPS/TLS，需要完成加密合规问答/材料     | App Store Connect -> Export Compliance  |
| 年龄分级问卷         | 需按内容风险真实填写                                       | App Store Connect -> App Information    |
| 订阅/IAP材料（如有） | 产品项、价格、恢复购买、服务条款一致性                     | App Store Connect -> In-App Purchases   |
| AI 内容治理说明      | 建议准备：违规内容拦截、举报入口、封禁策略、未成年人保护   | 审核说明附件/内部留档                   |
| 技术构建门槛         | 注意 Apple 即将要求 2026-04-28 起用 Xcode 26 + SDK 26 提交 | CI/CD 与发布规范                        |

## 2. 中国大陆新增材料

| 材料                             | 是否必备                       | 触发条件                                            | 提交位置/备注                                                       |
| -------------------------------- | ------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------- |
| ICP 备案号                       | 必备（中国大陆上架时）         | 计划在中国大陆可下载                                | App 信息页填写；需与 MIIT 备案信息和元数据匹配                      |
| 中国主体信息（中文公司名、USCI） | 中国大陆组织通常需要           | 开发者主体为中国大陆组织                            | Apple 会从 D-U-N-S 关联信息展示                                     |
| APP 备案编号（工信部）           | 必备（境内提供互联网信息服务） | 面向中国大陆用户提供服务                            | 通过 `beian.miit.gov.cn` 体系办理；App 内需显著标注备案编号并可核验 |
| 生成式 AI 备案/登记信息          | AI 聊天重点项                  | 提供生成式 AI 服务（尤其具有舆论属性/社会动员能力） | 按属地网信部门要求办理；已上线功能需公示模型名称与备案号/上线编号   |
| 专项许可（按内容）               | 按场景                         | 涉及新闻/宗教/出版/游戏等                           | 需对应主管部门许可（新闻、宗教、出版、版号等）                      |

## 3. 海外新增材料（重点：欧盟）

| 材料                    | 是否必备    | 触发条件                                | 提交位置/备注                                 |
| ----------------------- | ----------- | --------------------------------------- | --------------------------------------------- |
| DSA Trader 状态声明     | 必备声明    | 任意 App 存在欧盟分发，或账号被要求声明 | App Store Connect -> Business -> Compliance   |
| DSA Trader 联系信息     | Trader 必备 | 声明为 Trader                           | 地址/电话/邮箱（会展示在欧盟商店页）          |
| DSA Trader 验证文件     | Trader 必备 | 声明为 Trader                           | 需可验证主体名称与地址的商业/法律文件         |
| Labels and Markings URL | 可选        | 欧盟法律场景需要标签/标识时             | App 信息 -> DSA 区域                          |
| 海外隐私权利入口        | 强烈建议    | 海外多法域（EU/US 等）                  | 隐私政策与 App 内设置页提供删除/导出/撤回路径 |

## 4. AI聊天工具建议额外准备（降低被拒概率）

- [ ] 内容安全策略：违禁词、违法内容、未成年人保护、误用防控。
- [ ] 人工介入流程：举报后处理时效、复核机制、封禁机制。
- [ ] 模型与第三方清单：模型提供商、SDK 名称、数据去向、保留时长。
- [ ] 风险声明：医疗/法律/金融等高风险场景非专业建议提示。
- [ ] 数据主体请求流程：导出、删除、注销、申诉的可执行工单流程。

## 5. 官方查询入口（建议直接收藏）

### Apple 官方

- App 审核指南：<https://developer.apple.com/app-store/review/guidelines/>
- 提交审核流程：<https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app>
- 地区可用性设置：<https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/manage-availability-for-your-app-on-the-app-store/>
- App 信息字段（含中国大陆专项字段）：<https://developer.apple.com/help/app-store-connect/reference/app-information/app-information>
- 中国大陆合规信息：<https://developer.apple.com/help/app-store-connect/manage-compliance-information/view-mainland-china-compliance-information>
- 欧盟 DSA Trader：<https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements>
- 隐私问卷：<https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy>
- 加密出口合规：<https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance>
- 即将生效要求（含 Xcode/SDK 门槛）：<https://developer.apple.com/news/upcoming-requirements/>

### 中国大陆监管入口

- 工信部《开展 APP 备案工作的通知》（工信部信管〔2023〕105号）：<https://www.miit.gov.cn/jgsj/xgj/wjfb/art/2023/art_dd783a581c9644a4aee10afa582811db.html>
- 上述通知解读（含备案系统说明）：<https://www.miit.gov.cn/zwgk/zcjd/art/2023/art_39b4f1acc36745b98478e0ec3e07128d.html>
- 工信部备案系统：<http://beian.miit.gov.cn>

### 生成式 AI 备案相关

- 《生成式人工智能服务管理暂行办法》发布说明（2023-08-15施行）：<https://www.cac.gov.cn/2023-07/13/c_1690898326795531.htm>
- 国家网信办 2025 年度生成式 AI 备案公告（2026-01-09发布）：<https://www.cac.gov.cn/2026-01/09/c_1769688009588554.htm>

---

备注：本清单用于上架准备，不构成法律意见。涉及中国大陆 AI 备案、数据跨境、欧盟消费者法等问题，建议在提审前做一次法务复核。
