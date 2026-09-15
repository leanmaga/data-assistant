import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { ddl_text } = await request.json();

    if (!ddl_text || typeof ddl_text !== "string") {
      return NextResponse.json(
        { error: "ddl_text is required" },
        { status: 400 },
      );
    }

    const schema = parseSchemaFromDDL(ddl_text);
    return NextResponse.json({ schema });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to parse schema",
      },
      { status: 400 },
    );
  }
}

function parseSchemaFromDDL(ddlText: string) {
  const tables: Record<string, any> = {};
  const tableMatches = [...ddlText.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w"`]+)\s*\((.|\n)*?\);/gi)];

  for (const match of tableMatches) {
    const tableName = match[1].replace(/["`]/g, "");
    const body = match[0].replace(/.*?\((.*)\);/is, "$1");
    const columns: any[] = [];
    const primaryKeys: string[] = [];
    const foreignKeys: any[] = [];

    const splitColumns = body
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
      .filter((entry) => !/^CONSTRAINT\s+/i.test(entry));

    for (const entry of splitColumns) {
      if (/^PRIMARY\s+KEY/i.test(entry)) {
        const matchPk = entry.match(/\(([^)]+)\)/i);
        if (matchPk) {
          for (const key of matchPk[1].split(",")) {
            primaryKeys.push(key.trim().replace(/[`"\s]/g, ""));
          }
          continue;
        }
      }

      if (/^FOREIGN\s+KEY/i.test(entry)) {
        const fkMatch = entry.match(
          /FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([\w"`]+)\s*\(([^)]+)\)/i,
        );
        if (fkMatch) {
          foreignKeys.push({
            column: fkMatch[1].trim().replace(/[`"\s]/g, ""),
            refTable: fkMatch[2].trim().replace(/[`"\s]/g, ""),
            refColumn: fkMatch[3].trim().replace(/[`"\s]/g, ""),
          });
          continue;
        }
      }

      const columnMatch = entry.match(/^([\w"`]+)\s+([\w()]+)(.*)$/i);
      if (!columnMatch) continue;

      const [, rawName, rawType, rawConstraints = ""] = columnMatch;
      const name = rawName.replace(/[`"\s]/g, "");
      const type = rawType.trim();
      const constraints = rawConstraints.trim();

      if (/PRIMARY\s+KEY/i.test(constraints)) {
        primaryKeys.push(name);
      }

      columns.push({
        name,
        type,
        constraints,
      });
    }

    tables[tableName] = {
      columns,
      primary_keys: primaryKeys,
      foreign_keys: foreignKeys,
    };
  }

  return tables;
}
