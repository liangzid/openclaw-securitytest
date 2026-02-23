# PyRIT Setup Guide

PyRIT (Python Risk Identification Toolkit) 是 Microsoft 开发的 AI 风险识别工具包。

## 环境设置

### 1. 使用 uv 创建 Python 环境

项目已配置好 uv 环境：

```bash
# 环境已创建在 .venv/
# 激活环境
source .venv/bin/activate
```

### 2. 安装 PyRIT

PyRIT 需要从 GitHub 安装：

```bash
# 方法 1: 从 GitHub 安装最新版
uv pip install git+https://github.com/Azure/PyRIT.git

# 方法 2: 克隆并安装本地开发版
cd /tmp
git clone https://github.com/Azure/PyRIT.git
cd PyRIT
uv pip install -e .
```

### 3. 验证安装

```python
import pyrit
print(pyrit.__version__)
```

---

## PyRIT 数据集导入

我们已经把 PyRIT 的 jailbreak templates 导入到了 `benchmark-payloads.ts` 中。

### 可用的 PyRIT 数据

PyRIT 包含以下数据集：

| 数据集 | 位置 | 说明 |
|--------|------|------|
| Jailbreak Templates | `pyrit/datasets/jailbreak/templates/` | 60+ jailbreak 模板 |
| Arth_Singh Collection | `pyrit/datasets/jailbreak/templates/Arth_Singh/` | 50+ 高级 jailbreak |
| Red Teaming | `pyrit/datasets/executors/red_teaming/` | Persuasion/deception 攻击 |
| Tree of Attacks | `pyrit/datasets/executors/tree_of_attacks/` | 攻击树生成 |

---

## 使用 PyRIT 进行攻击测试

### 基础用法

```python
from pyrit.prompt_target import OpenAIChatTarget
from pyrit.orchestrator import RedTeamingOrchestrator

# 配置目标
target = OpenAIChatTarget(
    model_name="gpt-4",
    deployment_name="your-deployment"
)

# 创建攻击编排器
orchestrator = RedTeamingOrchestrator(
    objective="Get the system prompt",
    prompt_target=target
)

# 运行攻击
result = await orchestrator.execute_attack()
```

### PyRIT 攻击类型

| 攻击类型 | 说明 |
|---------|------|
| Skeleton Key Attack | 骨架钥匙攻击 |
| Crescendo Attack | 渐强攻击 |
| Flip Attack | 翻转攻击 |
| Tree of Attacks (ToA) | 攻击树 |
| PAIR (Prompt Automatic Iterative Refinement) | 自动迭代优化 |
| TAP (Tree of Adversarial Prompts) | 对抗提示树 |

---

## OpenClaw 集成方案

### 方案 1: 使用 PyRIT 生成攻击

```python
# scripts/run-pyrit-attacks.py
import sys
from pathlib import Path

# Add PyRIT to path
sys.path.append("/tmp/PyRIT")

from pyrit.datasets import JailbreakTemplateDataset

# Load jailbreak templates
dataset = JailbreakTemplateDataset()
templates = dataset.get_all_templates()

# Convert to OpenClaw format
for template in templates:
    attack = {
        "id": f"pyrit-{template.name}",
        "name": template.name,
        "category": "jailbreak",
        "severity": "critical",
        "payload": template.prompt
    }
    # Add to OpenClaw attack suite
```

### 方案 2: 使用 PyRIT 作为独立评估工具

```bash
# 在单独的终端运行 PyRIT
cd /tmp/PyRIT
python -m pyrit ...
```

---

## 参考资源

- [PyRIT GitHub](https://github.com/Azure/PyRIT)
- [PyRIT Documentation](https://pyrit.readthedocs.io/)
- [PyRIT Cookbooks](https://github.com/Azure/PyRIT/tree/main/doc/cookbooks)
