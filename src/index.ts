import path from "path";
import axios from "axios";
import querystring from "querystring";
import { createDirIfNotExists, writeJsonFile } from "./helper";

interface AccessTokenResponse {
  code: number;
  msg: string;
  tenant_access_token: string;
  expire: number;
}

interface BitableRecordsResponse {
  code: number;
  msg: string;
  data: {
    has_more: boolean;
    total: number;
    page_token: string;
    items: { fields: Record<string, string>; id: string; record_id: string }[];
  };
}

interface Config {
  app_id: string;
  app_secret: string;
  app_token: string; // 多维表格的唯一标识符
  table_id: string; // 多维表格数据表的唯一标识符
  langues: string[];
  outputDir: string; // 输出目录
  suffix?: string; // 文件路径
  fieldFileNameMap?: Record<string, string> // 字段名映射文件名（避免字段存在中文）
}

const args = process.argv.slice(2);
const [configPath] = args;

const CONFIG_PATH = configPath
  ? path.join(process.cwd(), configPath)
  : path.join(process.cwd(), "i18n.config.json");

// https://test-d1qa1t4gmrzy.feishu.cn/base/Sf6KbG60yaRBhoskKVNcsZ1Nnv1?table=tblbcZ3QDtPApMCt&view=vewJverQkB

const config: Config = require(CONFIG_PATH);

const OUT_PUT_DIR = path.join(process.cwd(), config.outputDir);

class FeiShuClient {
  config: Config;
  tenant_access_token: string = "";

  constructor() {
    this.config = this.getConfig();
  }

  public async init() {
    this.config = await this.getConfig();
    await this.refreshToken();
  }

  public async refreshToken() {
    try {
      const tokenRes = await this.getTenantAccessToken();
      this.tenant_access_token = `Bearer ${tokenRes.tenant_access_token}`;
      console.log("\x1b[32m", "Get token success");
    } catch (err) {
      console.log(
        "\x1B[31m",
        "Get token failed, cause: " + (err as Error).message
      );
    }
  }

  public async loadBitable(
    map: Record<string, Record<string, string>>,
    page_token?: string
  ) {
    const res = await this.getBitableRecords(page_token);
    res.data.items.forEach((row, idx) => {
      const key = row.fields["key"];
      if (!key) return;
      this.config.langues.forEach((lang) => {
        if (!row.fields[lang]) return;
        map[lang][key] = row.fields[lang];
      });
    });
    console.log("\x1b[32m", `Load ${page_token ?? "first"} page success`);
    if (res.data.page_token) {
      await this.loadBitable(map, res.data.page_token);
    }
  }

  public async generateFiles() {
    try {
      const map: Record<string, Record<string, string>> = {};
      this.config.langues.forEach((lang) => (map[lang] = {}));
      await this.loadBitable(map);
      createDirIfNotExists(OUT_PUT_DIR);
      Object.keys(map).forEach((lang) => {
        writeJsonFile(
          path.join(OUT_PUT_DIR, `${this.config.fieldFileNameMap?.[lang] ?? lang}.${this.config.suffix ?? ""}json`),
          map[lang]
        );
      });
      console.log("\x1b[32m", "Generate file success");
    } catch (err) {
      console.log(
        "\x1B[31m",
        "Get bitable records failed, cause: " + (err as Error).message
      );
    }
  }

  private getConfig(): Config {
    return config;
  }

  private async getTenantAccessToken(): Promise<AccessTokenResponse> {
    const res = await axios.post(
      "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
      {
        app_id: this.config.app_id,
        app_secret: this.config.app_secret,
      },
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
    return res.data;
  }

  private async getBitableRecords(
    page_token?: string
  ): Promise<BitableRecordsResponse> {
    const field_names = `[${["key", ...this.config.langues]
      .map((val) => `"${val}"`)
      .join(",")}]`;
    const query = querystring.encode({
      field_names,
      page_size: 500,
      page_token,
    });
    const res = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${this.config.app_token}/tables/${this.config.table_id}/records?${query}`,
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: this.tenant_access_token,
        },
      }
    );
    return res.data;
  }
}

const main = async () => {
  const client = new FeiShuClient();
  await client.init();
  await client.generateFiles();
};

main();
