interface WbsImportPasteViewProps {
  csvText: string
  setCsvText: (text: string) => void
}

export function WbsImportPasteView({ csvText, setCsvText }: WbsImportPasteViewProps) {
  return (
    <div className="mb-6">
      <p className="text-sm text-app-subtle mb-2">
        Ensure the first row has headers. Example: <strong>Task Name, Type</strong> or <strong>WBS Code, Task Name</strong>.
      </p>
      <textarea
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        className="w-full h-48 px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-fg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        placeholder="WBS Code, Task Name, Type&#10;1, Foundation, Summary&#10;1.1, Dig Trench, Task"
      />
    </div>
  )
}
