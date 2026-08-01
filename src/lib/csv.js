export function parseCsv(text) {
  const rows = [];
  let fields = [];
  let field = '';
  let inQuotes = false;
  const pushField = () => {
    fields.push(field);
    field = '';
  };
  const endRecord = () => {
    pushField();
    const value = fields[0]?.trim();
    if (value) rows.push(value);
    fields = [];
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      pushField();
    } else if (ch === '\n' || ch === '\r') {
      endRecord();
      if (ch === '\r' && text[i + 1] === '\n') i++;
    } else {
      field += ch;
    }
  }
  endRecord();
  return rows;
}

export function toCsv(rows) {
  return rows.map(text => {
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }).join('\n');
}
