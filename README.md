# i18n-toolkit-feishu

从飞书多维表格拉取文案并生成 i18n JSON 文件。

## 安装

```bash
npm i i18n-toolkit-feishu
```

## 使用

默认读取当前目录下的 `i18n.config.json`：

```bash
i18n-toolkit
```

也可以指定配置文件路径：

```bash
i18n-toolkit ./path/to/i18n.config.json
```

## 配置文件（i18n.config.json）

### 1. schema 怎么拿到

- 在本仓库开发时：`$schema` 用 `./i18n.config.schema.json`
- 在业务项目作为依赖安装后：`$schema` 用 `./node_modules/i18n-toolkit-feishu/i18n.config.schema.json`

### 2. 配置怎么写

```json
{
  "$schema": "./node_modules/i18n-toolkit-feishu/i18n.config.schema.json",
  "app_id": "cli_xxx",
  "app_secret": "xxx",
  "app_token": "bascn_xxx",
  "table_id": "tblxxx",
  "langues": ["zh-CN", "en-US"],
  "outputDir": "locales",
  "pluginFile": "./i18n.plugins.js",
  "keyField": "key",
  "suffix": "",
  "fieldFileNameMap": {
    "zh-CN": "zh",
    "en-US": "en"
  }
}
```

### 3. 字段说明

- `app_id`、`app_secret`：飞书应用凭证
- `app_token`：多维表格 app token
- `table_id`：数据表 ID
- `langues`：语言字段名列表（保持和飞书表头一致）
- `outputDir`：输出目录
- `pluginFile`：插件文件路径，插件文件需默认导出 `I18nPlugin[]`
- `keyField`：主键字段名，默认 `key`
- `suffix`：输出文件名后缀（不包含 `json`）
- `fieldFileNameMap`：字段名到输出文件名的映射

注意：字段名是 `langues`，不是 `languages`。

## 插件示例

`pluginFile` 指向的文件需要默认导出一个数组，数组元素是 `I18nPlugin`。

```js
const { createPlugin } = require("i18n-toolkit-feishu");

module.exports.default = [
  // filter 返回 true 表示保留，返回 false 表示丢弃
  createPlugin("filter", (record) => record.status !== "废弃", ["status"]),
  // normal 一次性接收“过滤后”的所有分页数据
  // 字段范围: keyField + langues + 所有插件的 extraFields
  createPlugin("normal", (records) => {
    records.forEach((record) => {
      if (record.key) record.key = record.key.trim();
    });
  }),
];
```
