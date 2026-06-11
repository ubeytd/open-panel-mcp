import { describe, expect, it } from "vitest";
import { getCliResult } from "../cli.js";

describe("CLI metadata flags", () => {
  it("prints usage for --help without requiring credentials", () => {
    const result = getCliResult(["--help"]);

    expect(result).toEqual(
      expect.objectContaining({
        exitCode: 0,
        stream: "stdout",
      })
    );
    expect(result?.output).toContain("Usage: openpanel-mcp-server");
    expect(result?.output).toContain("OPENPANEL_CLIENT_ID");
  });

  it("prints the package version for --version", () => {
    const result = getCliResult(["--version"]);

    expect(result).toEqual({
      exitCode: 0,
      stream: "stdout",
      output: "1.0.0",
    });
  });

  it("reports unknown top-level flags before credential validation", () => {
    const result = getCliResult(["--definitely-not-a-real-flag"]);

    expect(result).toEqual(
      expect.objectContaining({
        exitCode: 1,
        stream: "stderr",
      })
    );
    expect(result?.output).toContain("Unknown option: --definitely-not-a-real-flag");
  });

  it("does not handle normal MCP server startup", () => {
    expect(getCliResult([])).toBeNull();
  });
});
