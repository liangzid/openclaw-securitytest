# Prompt Injection 评估 Benchmark & 攻击库分析

> 分析业界知名的 LLM 安全测试框架、评估基准和攻击库，以便将 OpenClaw 的攻击测试套件系统化。

---

## 目录

1. [业界知名测试框架](#业界知名测试框架)
2. [Prompt Injection 数据集](#prompt-injection-数据集)
3. [攻击 Payload 库](#攻击-payload-库)
4. [MITRE ATLAS 映射](#mitre-atlas-映射)
5. [OpenClaw 集成方案](#openclaw-集成方案)

---

## 业界知名测试框架

### 1. Garak

**项目**: [github.com/leondz/garak](https://github.com/leondz/garak)

**简介**: LLM 安全测试框架，支持多种攻击类型和探测模块。

**核心特性**:

- 模块化探测器 (Probes)
- 检测器 (Detectors)
- 生成器 (Generators)
- 支持多种模型提供商 (OpenAI, Anthropic, HuggingFace 等)

**Prompt Injection 相关模块**:

```
garak/probes/
├── promptinject/           # Prompt injection 探测
│   ├── basic.py           # 基础 PI 攻击
│   ├── dan.py             # DAN 风格攻击
│   ├── encoding.py        # 编码混淆攻击
│   ├── json.py            # JSON 注入
│   ├── leaked.py          # 系统提示词泄露
│   ├── multi.py           # 多步攻击
│   └── translation.py     # 翻译攻击
└── encoding/              # 编码探测
    └── base64.py
```

**测试覆盖的攻击类型**:

- 直接 Prompt Injection
- 间接 Prompt Injection
- 编码混淆 (Base64, ROT13, 等)
- DAN/Jailbreak
- 系统提示词泄露
- 多语言攻击

---

### 2. Inspect AI

**项目**: [github.com/UKGovernmentBEIS/inspect_ai](https://github.com/UKGovernmentBEIS/inspect_ai)

**简介**: 英国政府开发的 AI 安全评估框架。

**核心特性**:

- 声明式评估定义
- 自动评分系统
- 支持多种评估协议
- 详细的结果报告

---

### 3. PyRIT (Python Risk Identification Toolkit)

**项目**: [github.com/Azure/PyRIT](https://github.com/Azure/PyRIT)

**简介**: Microsoft Azure 开发的 AI 风险识别工具包。

**核心特性**:

- Prompt Injection 测试
- 内容安全测试
- 自动化红队测试
- 与 Azure OpenAI 集成

---

### 4. LLM Guard

**项目**: [github.com/protectai/llm-guard](https://github.com/protectai/llm-guard)

**简介**: 输入和输出安全扫描器。

**核心特性**:

- 输入扫描 (Prompt Injection 检测)
- 输出扫描 (敏感信息过滤)
- 可配置的规则
- 延迟优化

---

### 5. Rebuff

**项目**: [github.com/protectai/rebuff](https://github.com/protectai/rebuff)

**简介**: Prompt Injection 检测库。

**核心特性**:

- 启发式检测
- 向量数据库相似度检测
- LLM 自检测
- 可训练的检测模型

---

## Prompt Injection 数据集

### 1. PromptInject Dataset

**来源**: Garak 框架内置

**规模**: 数百个精心设计的 prompt injection payload

**攻击类型**:

- 经典 "Ignore Previous Instructions"
- DAN/Jailbreak
- 编码混淆
- 翻译攻击
- 系统标签注入
- Markdown 注入

---

### 2. HarmBench

**来源**: [github.com/centerforaisafety/HarmBench](https://github.com/centerforaisafety/HarmBench)

**简介**: 有害行为基准测试，包含多种攻击类型。

**包含的攻击**:

- 拒绝服务
- 非法活动指导
- 骚扰
- 误导信息
- 隐私侵犯

---

### 3. WildTeaming Dataset

**来源**: Meta AI 研究

**简介**: 真实世界的对抗性提示收集。

**特点**:

- 来自真实用户的攻击尝试
- 多样化的攻击策略
- 持续更新

---

### 4. JailbreakBench

**来源**: 学术界研究数据集

**简介**: 专门针对 jailbreak 攻击的基准测试。

---

## 攻击 Payload 库

### 1. Awesome Jailbreak Prompts

**仓库**: GitHub 上的各种收集

**特点**:

- 数百种 jailbreak 技巧
- 持续更新
- 社区贡献

**常见攻击技巧**:

- DAN (Do Anything Now)
- STAN (Standard DAN)
- Developer Mode
- Character Roleplay
- 代码混淆
- 多语言绕

---

### 2. Prompt Engineering Guide - Adversarial Section

**来源**: [promptengineering.org](https://www.promptengineering.org/)

**内容**:

- 攻击技术文档
- 防御策略
- 最佳实践

---

## MITRE ATLAS 映射

OpenClaw 已有的威胁模型与 MITRE ATLAS 映射：

| ATLAS ID      | Technique                      | OpenClaw Threat            | 我们的测试           |
| ------------- | ------------------------------ | -------------------------- | -------------------- |
| AML.T0051.000 | LLM Prompt Injection: Direct   | T-EXEC-001                 | ✅ pi-001 ~ pi-010   |
| AML.T0051.001 | LLM Prompt Injection: Indirect | T-EXEC-002                 | ✅ ipi-001 ~ ipi-008 |
| AML.T0043     | Craft Adversarial Data         | T-EXEC-004, T-EVADE-001    | ✅ 编码混淆等        |
| AML.T0031     | Erode AI Model Integrity       | T-IMPACT-001, T-IMPACT-002 | ✅ 工具注入          |

---

## OpenClaw 集成方案

### 方案 1: Garak 适配器（推荐）

创建一个适配器，允许 OpenClaw 直接使用 Garak 的探测模块：

```typescript
// src/security/attacks/garak-adapter.ts
import { spawn } from "node:child_process";
import { AttackPrompt, AttackResult } from "./types";

export async function runGarakProbe(
  probeName: string,
  modelEndpoint: string,
): Promise<AttackResult[]> {
  // 调用 garak 并解析结果
  // garak -m openai --model_name gpt-4 -p promptinject
}
```

**优点**:

- 利用成熟的 Garak 生态系统
- 持续获得最新攻击手法
- 标准化的结果格式

**缺点**:

- 需要 Python 环境
- Garak 依赖较重

---

### 方案 2: 导入 Garak Payload 数据库

将 Garak 的 payload 转换为 OpenClaw 格式：

```typescript
// src/security/attacks/garak-payloads.ts
export const GARAK_PROMPT_INJECT_PAYLOADS: AttackPrompt[] = [
  {
    id: "garak-pi-basic-001",
    name: "Garak Basic PI 1",
    category: "prompt_injection",
    severity: "critical",
    payload: "...",
  },
  // ... 数百个 payload
];
```

**优点**:

- 无外部依赖
- 完全控制测试流程
- 可以选择性导入

**缺点**:

- 需要定期同步更新
- 缺少 Garak 的动态生成能力

---

### 方案 3: 混合方案（最佳）

1. **核心测试**: OpenClaw 自有的测试套件（已实现）
2. **扩展测试**: 导入 Garak payload 数据库
3. **高级测试**: 可选的 Garak 适配器

**实现计划**:

```
src/security/attacks/
├── types.ts              # 已存在
├── prompt-injection.ts   # 已存在 (10个)
├── indirect-injection.ts # 已存在 (8个)
├── tool-injection.ts     # 已存在 (10个)
├── other-attacks.ts      # 已存在 (11个)
├── garak-payloads.ts     # 新增: Garak payload (200+个)
├── garak-adapter.ts      # 新增: 可选的 Garak 集成
└── benchmarks.ts         # 新增: Benchmark 运行器
```

---

## 推荐的下一步

### 1. 立即执行

- [ ] 创建 `garak-payloads.ts`，导入最常见的 50-100 个 prompt injection payload
- [ ] 更新 `README_ATTACK_TESTS.md`，添加 benchmark 说明
- [ ] 运行完整测试，生成基准报告

### 2. 短期执行

- [ ] 创建 `benchmarks.ts`，支持标准评估协议
- [ ] 添加 HarmBench 数据集导入
- [ ] 实现自动化评分系统

### 3. 长期规划

- [ ] 完整的 Garak 适配器
- [ ] 与 MITRE ATLAS 完全对齐的测试覆盖
- [ ] 持续集成中的安全回归测试

---

## 参考资源

### 项目链接

- [Garak GitHub](https://github.com/leondz/garak)
- [PyRIT GitHub](https://github.com/Azure/PyRIT)
- [LLM Guard GitHub](https://github.com/protectai/llm-guard)
- [Rebuff GitHub](https://github.com/protectai/rebuff)
- [Inspect AI GitHub](https://github.com/UKGovernmentBEIS/inspect_ai)

### 论文

- "Prompt Injection Attacks and Defenses in LLM-Integrated Applications" (2023)
- "Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection" (2023)
- "Universal and Transferable Adversarial Attacks on Aligned Language Models" (2023)

### 标准框架

- [MITRE ATLAS](https://atlas.mitre.org/)
- [OWASP Top 10 for LLM](https://owasp.org/www-project-top-10-for-large-language-model-applications/)

---

_文档创建时间: 2026-02-22_
