export const SERVER_NAME = "openpanel-mcp-server";
export const SERVER_VERSION = "1.0.0";

export type CliStream = "stdout" | "stderr";

export interface CliResult {
  exitCode: number;
  stream: CliStream;
  output: string;
}

const HELP_TEXT = `Usage: ${SERVER_NAME} [options]

OpenPanel MCP server for analytics tools over stdio.

Options:
  -h, --help       Show this help message
  -v, --version    Show the package version

Environment:
  OPENPANEL_CLIENT_ID       Required for normal MCP server startup
  OPENPANEL_CLIENT_SECRET   Required for normal MCP server startup
  OPENPANEL_API_URL         Optional self-hosted API URL`;

export function getCliResult(args: string[]): CliResult | null {
  if (args.includes("--help") || args.includes("-h")) {
    return {
      exitCode: 0,
      stream: "stdout",
      output: HELP_TEXT,
    };
  }

  if (args.includes("--version") || args.includes("-v")) {
    return {
      exitCode: 0,
      stream: "stdout",
      output: SERVER_VERSION,
    };
  }

  const unknownOption = args.find((arg) => arg.startsWith("-"));
  if (unknownOption) {
    return {
      exitCode: 1,
      stream: "stderr",
      output: `Unknown option: ${unknownOption}\nRun \`${SERVER_NAME} --help\` for usage.`,
    };
  }

  return null;
}

export function handleCliArgs(args = process.argv.slice(2)): void {
  const result = getCliResult(args);
  if (!result) {
    return;
  }

  const write = result.stream === "stdout" ? console.log : console.error;
  write(result.output);
  process.exit(result.exitCode);
}
