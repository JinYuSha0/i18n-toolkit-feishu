import path from "path";

export interface I18nFilterPlugin {
  type: "filter";
  func: (record: Record<string, string>) => boolean | Promise<boolean>;
  extraFields?: string[];
}

export interface I18nNormalPlugin {
  type: "normal";
  func: (record: Record<string, string>) => void | Promise<void>;
  extraFields?: string[];
}

export type I18nPlugin = I18nFilterPlugin | I18nNormalPlugin;

export function createPlugin(
  type: "filter",
  func: (record: Record<string, string>) => boolean | Promise<boolean>,
  extraFields?: string[],
): I18nFilterPlugin;
export function createPlugin(
  type: "normal",
  func: (record: Record<string, string>[]) => void | Promise<void>,
  extraFields?: string[],
): I18nNormalPlugin;
export function createPlugin(
  type: "filter" | "normal",
  func: (record: any) => any,
  extraFields?: string[],
): I18nPlugin {
  return {
    type,
    func,
    extraFields,
  };
}

function getPluginModulePath(pluginFile: string, configPath: string) {
  return path.isAbsolute(pluginFile)
    ? pluginFile
    : path.resolve(path.dirname(configPath), pluginFile);
}

function assertPlugin(
  plugin: unknown,
  idx: number,
): asserts plugin is I18nPlugin {
  if (!plugin || typeof plugin !== "object") {
    throw new Error(`Plugin at index ${idx} is not an object`);
  }
  const candidate = plugin as Partial<I18nPlugin>;
  if (candidate.type !== "filter" && candidate.type !== "normal") {
    throw new Error(
      `Plugin at index ${idx} has invalid type, expected "filter" or "normal"`,
    );
  }
  if (typeof candidate.func !== "function") {
    throw new Error(`Plugin at index ${idx} is missing callable func`);
  }
  if (candidate.extraFields !== undefined) {
    const invalidExtraFields =
      !Array.isArray(candidate.extraFields) ||
      candidate.extraFields.some(
        (field) => typeof field !== "string" || field.length === 0,
      );
    if (invalidExtraFields) {
      throw new Error(
        `Plugin at index ${idx} has invalid extraFields, expected string[]`,
      );
    }
  }
}

export function loadPlugins(
  pluginFile: string | undefined,
  configPath: string,
): I18nPlugin[] {
  if (!pluginFile) return [];
  const pluginModulePath = getPluginModulePath(pluginFile, configPath);
  const pluginModule = require(pluginModulePath) as { default?: unknown };
  const plugins = (pluginModule.default ?? pluginModule) as unknown;
  if (!Array.isArray(plugins)) {
    throw new Error(
      `Plugin file must default export I18nPlugin[], current file: ${pluginModulePath}`,
    );
  }
  plugins.forEach((plugin, idx) => assertPlugin(plugin, idx));
  console.log("\x1b[32m", `Load plugin file success: ${pluginModulePath}`);
  return plugins;
}

export async function runFilterPlugins(
  plugins: I18nPlugin[],
  record: Record<string, string>,
): Promise<boolean> {
  let shouldKeep = true;
  for (const plugin of plugins) {
    if (plugin.type === "filter") {
      try {
        shouldKeep = await plugin.func(record);
      } catch {}
      if (!shouldKeep) return false;
    }
  }
  return true;
}

export async function runNormalPlugins(
  plugins: I18nPlugin[],
  records: Record<string, string>[],
) {
  for (const plugin of plugins) {
    if (plugin.type === "normal") {
      try {
        await (
          plugin.func as unknown as (
            rows: Record<string, string>[],
          ) => void | Promise<void>
        )(records);
      } catch {}
    }
  }
}

export function collectPluginExtraFields(plugins: I18nPlugin[]): string[] {
  const fields = new Set<string>();
  plugins.forEach((plugin) => {
    plugin.extraFields?.forEach((field) => fields.add(field));
  });
  return [...fields];
}
