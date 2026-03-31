export interface Config {
  app_id: string;
  app_secret: string;
  app_token: string; // 多维表格的唯一标识符
  table_id: string; // 多维表格数据表的唯一标识符
  langues: string[];
  outputDir: string; // 输出目录
  keyField?: string; // 主键字段名
  suffix?: string; // 文件后缀
  fieldFileNameMap?: Record<string, string>; // 字段名映射文件名（避免字段存在中文）
  pluginFile?: string; // 插件文件路径
}
