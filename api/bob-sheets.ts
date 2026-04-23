/**
 * Integracao Google Sheets para o Bob
 * Insere tarefas e cronogramas nas planilhas do usuario
 */

const GOOGLE_SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

/**
 * Extrai o ID da planilha de uma URL do Google Sheets
 */
export function extractSheetId(urlOrId: string): string {
  // Se ja for um ID (sem /), retorna direto
  if (!urlOrId.includes("/")) return urlOrId;

  // Extrai de URL tipo: https://docs.google.com/spreadsheets/d/XXXX/edit
  const match = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] ?? urlOrId;
}

/**
 * Insere uma linha na planilha de tarefas (Follow up)
 */
export async function insertTaskRow(
  accessToken: string,
  sheetId: string,
  tabName: string,
  row: {
    job: string;
    resumo: string;
    tipo: string;
    status: string;
    departamento: string;
    prazo: string;
    responsavel: string;
    notes: string;
  },
): Promise<void> {
  const range = `${tabName}!A:H`;
  const url = `${GOOGLE_SHEETS_API}/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: [[
        row.job,
        row.resumo,
        row.tipo,
        row.status,
        row.departamento,
        row.prazo,
        row.responsavel,
        row.notes,
      ]],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Sheets API error (${response.status}): ${error}`);
  }
}

/**
 * Insere uma linha na planilha pessoal
 */
export async function insertPersonalTaskRow(
  accessToken: string,
  sheetId: string,
  tabName: string,
  row: {
    data: string;
    tarefa: string;
    status: string;
    categoria: string;
    notes: string;
  },
): Promise<void> {
  const range = `${tabName}!A:E`;
  const url = `${GOOGLE_SHEETS_API}/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: [[
        row.data,
        row.tarefa,
        row.status,
        row.categoria,
        row.notes,
      ]],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Sheets API error (${response.status}): ${error}`);
  }
}

/**
 * Insere uma linha na planilha de cronograma
 */
export async function insertScheduleRow(
  accessToken: string,
  sheetId: string,
  tabName: string,
  row: {
    data: string;
    evento: string;
    local: string;
    horario: string;
    responsavel: string;
    job: string;
    notes: string;
  },
): Promise<void> {
  const range = `${tabName}!A:G`;
  const url = `${GOOGLE_SHEETS_API}/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: [[
        row.data,
        row.evento,
        row.local,
        row.horario,
        row.responsavel,
        row.job,
        row.notes,
      ]],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Sheets API error (${response.status}): ${error}`);
  }
}

/**
 * Le as tarefas da planilha (para consultas)
 */
export async function readTasks(
  accessToken: string,
  sheetId: string,
  tabName: string,
  limit: number = 50,
): Promise<string[][]> {
  const range = `${tabName}!A1:H${limit}`;
  const url = `${GOOGLE_SHEETS_API}/${sheetId}/values/${encodeURIComponent(range)}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to read sheet: ${response.status}`);
  }

  const data = (await response.json()) as { values?: string[][] };
  return data.values ?? [];
}
