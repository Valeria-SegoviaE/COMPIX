export function exportCsv(filename: string, headers: string[], rows: string[][]) {
  const quote = (value: string) => `"${value.replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map((row) => row.map(quote).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
