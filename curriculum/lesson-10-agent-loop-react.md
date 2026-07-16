# Lesson 10：Agent Loop 与 ReAct（推理 + 工具循环）

> **学习目标：** 弄清「为什么 Cursor 能连续修改 30 个文件、Claude Code 能自己修 Bug、测试 Agent 能跑到结束」；掌握 **Reason → Act → Observe** 循环、心智上理解「Planning 来自 LLM 而不是写死」；建立 Brain + Hands + Memory 三件套的 Agent 心智模型；看到 RAG 在 Agent 里更重要的角色——**长期记忆**。
>
> 本课不要求写框架代码，重点在**心智模型**，并把前面所有知识串成一个完整闭环。

---

## 本课目标

- 解释「为什么 Agent 不是一个回答，而是一个**循环**」
- 掌握 **ReAct（Reason → Act → Observe）** 模式
- 理解 **Planning 不是程序员写死的，而是 LLM 自己生成的**
- 认识 Agent 三大要素：**Brain / Hands / Memory**
- 看懂为什么 **Observe** 这一步不能省
- 建立「**RAG = Agent 的长期记忆**」的新视角

面向：**AI 应用开发 → AI Agent → AI 工程 → AI 产品**。

---

## 核心概念

### 一、从 Function Calling 到 Agent Loop

前两节我们学了：

- **Prompt**：决定 AI 怎么思考
- **Function Calling**：决定 AI 怎么使用工具

但还有一个问题：

> **为什么 Cursor 能连续修改 30 个文件？**
> **为什么 Claude Code 能自己修 Bug？**
> **为什么测试 Agent 能一直执行到测试完成？**

答案就是：

> **Reasoning（推理）+ Agent Loop（Agent 循环）**

---

### 二、先看一个简单任务

假设用户说：

> 帮我修复登录失败的问题。

普通聊天机器人可能直接回答：

```text
建议检查：
1. 用户名
2. 密码
3. 数据库
```

结束了。

但是真正的 Agent 不会。

**它会开始思考。**

---

### 三、Agent 的第一步：拆解任务

LLM 内部可能形成这样的计划（这里是为了帮助理解的示意，不代表模型一定以这种文字形式思考）：

```text
目标：
修复登录失败。

需要：
① 找代码
② 找报错
③ 定位原因
④ 修改代码
⑤ 跑测试
⑥ 如果失败继续修
```

注意：

> **Agent 最大的变化不是更聪明，而是开始把任务拆成多个步骤。**

---

### 四、Agent Loop（Agent 循环）

整个过程其实就是一个循环：

```text
目标
 ↓
思考（Reason）
 ↓
决定下一步（Plan）
 ↓
调用工具（Act）
 ↓
观察结果（Observe）
 ↓
继续思考
 ↓
直到完成
```

很多框架把它称为：

> **Reason → Act → Observe**

简称 **ReAct**。

---

### 五、举一个你工作里的例子

假设你以后做测试 Agent。

用户：

> 帮我验证这个 PRD。

Agent 会这样循环。

#### 第一次循环

```text
思考：
我要先拿 PRD。

行动：
read_prd()

结果：
PRD 内容
```

#### 第二次循环

```text
思考：
还需要接口文档。

行动：
read_swagger()

结果：
Swagger JSON
```

#### 第三次循环

```text
思考：
开始生成测试点。

行动：
generate_cases()
```

#### 第四次循环

```text
思考：
我要执行自动化。

行动：
playwright.run()
```

#### 第五次循环

```text
得到：
失败 —— Login Button Timeout

Agent 不会停。
它继续：

为什么失败？
  按钮不存在？
  页面没加载？
  Locator 错？

然后：
继续调用工具。
```

所以真正的 Agent 长这样：

```text
LLM
 ↓
Tool
 ↓
LLM
 ↓
Tool
 ↓
LLM
 ↓
Tool
 ↓
LLM
 ……
 直到结束
```

> **这就是为什么 Cursor 能一直工作几十分钟。**

---

### 六、为什么 Cursor 不会一次把所有事情做完？

因为：

> **每执行一步，世界都会发生变化。**

例如：

- 第一次：读取代码 → 得到 `LoginPage.java`
- 第二次：修改代码 → 代码已经变了
- 第三次：运行测试 → 结果又变了

所以：

> **每一步都必须重新思考。**

这就是：

```text
Observe
 ↓
Reason
 ↓
Act
 ↓
Observe
```

---

### 七、为什么需要 Observe？

很多新人容易忽略这一点。

假设：

```text
用户：帮我删除所有日志。
Agent：删除完成。
```

如果没有 Observe，Agent 根本不知道：到底删没删。

所以真正流程：

```text
删除
 ↓
查看 Git Diff
 ↓
确认删除成功
 ↓
再继续
```

Observe 的作用：

> **获取最新状态。**

没有 Observe，Agent 就是「闭着眼干活」。

---

### 八、Agent 为什么越来越像人？

假设你自己修 Bug：

```text
先看报错
 ↓
打开 IDE
 ↓
搜索代码
 ↓
修改
 ↓
运行
 ↓
失败
 ↓
继续改
```

这其实就是：

```text
Observe → Think → Act
```

Agent 只是把这个流程自动化了。

---

### 九、那 LLM 为什么能规划？

因为它学过大量：

```text
教程 / 代码 / 论文 / 博客 / 问答
```

例如它见过无数：

```text
修 Bug → 跑测试 → 提交 Git
```

于是用户说「修 Bug」，模型自然预测：下一步最合理就是「打开代码」。

所以：

> **Planning（规划）并不是程序员写死的。**
> **很多时候，Planning 是模型自己生成的。**

这也是为什么同一句 Prompt 给两个不同的 Agent 框架，可能走完全不同的路径 —— 因为规划是 LLM 在实时生成。

---

### 十、Agent 的三个核心能力

现在你应该能理解：

> 真正的 Agent 至少需要三样东西：

#### ① Brain（脑子）—— LLM

负责：思考、规划、推理、决策。

#### ② Hands（手）—— Tools

负责：执行。读文件、调 API、改代码、跑测试、发消息。

#### ③ Memory（记忆）—— Context

负责：记住**刚才发生了什么**。

例如：

```text
刚修改了：login.py
```

否则下一轮又忘了。

三者缺一不可。

```text
Brain
 ↓
Hands
 ↓
Memory
```

---

### 十一、这里出现一个新问题

如果 Agent 工作一个小时，上下文越来越长，会发生：

```text
100 页 → 1000 页 → 10000 页
```

LLM：越来越贵、越来越慢。

怎么办？

答案就是：

> **Memory（记忆系统）**

Agent 不会一直把所有内容放进 Prompt。

它会：

```text
总结
 ↓
压缩
 ↓
存数据库
 ↓
需要的时候再取回来
```

看到这里有没有熟悉？

这就是：

> **RAG 开始发挥作用了。**

很多人以为：

```text
RAG = 知识库
```

其实 **Agent 更需要 RAG**：因为 Agent 的 Memory 就靠 RAG。

---

### 十二、把今天和之前所有知识串起来

完整 Agent 流程：

```text
用户
 ↓
Prompt
 ↓
LLM（Reason）
 ↓
Tool（Act）
 ↓
Observe
 ↓
Memory 更新
 ↓
LLM
 ↓
Tool
 ↓
 ……
 ↓
完成任务
```

如果把它换成你的测试 Agent：

```text
PRD
 ↓
LLM
 ↓
读取 Swagger
 ↓
生成测试点
 ↓
运行 Playwright
 ↓
分析失败
 ↓
重新执行
 ↓
生成报告
 ↓
提交 GitLab
 ↓
通知企业微信
```

> **这就是一个完整的 Agent。**

---

## 本课总结（牢记 7 句）

1. **Agent 的核心不是一次回答，而是持续完成任务。**
2. **Agent 会不断循环：Reason → Act → Observe。**
3. **每一步执行后都会根据最新结果重新规划下一步。**
4. **Planning 很多时候来自 LLM 本身，而不是写死的流程。**
5. **一个完整的 Agent 至少需要：Brain（LLM）、Hands（Tools）、Memory（记忆）。**
6. **Memory 不能无限增长，因此需要总结、压缩和按需检索。**
7. **RAG 不仅能服务知识库，还能成为 Agent 的长期记忆系统。**

---

## 下一课预告

下一节进入 **Memory（记忆）**。

这一节会解释很多 AI 初学者最容易混淆的问题，例如：

- 为什么 ChatGPT 会「忘记」前面说的话？
- Context Window（上下文窗口）到底是什么？
- Token 为什么越来越贵？
- 为什么要做短期记忆、长期记忆？
- RAG 为什么能让 Agent「记住」几百万字的知识？

这一部分和你未来做测试 Agent、Cursor Skill、MCP 服务都直接相关，也是 AI 工程中的核心能力之一。