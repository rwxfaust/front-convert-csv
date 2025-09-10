import { useState } from 'react'
import * as XLSX from 'xlsx'
import './App.css'

interface FileMetadata {
  name: string
  size: number
  type: string
  lastModified: number
  lastModifiedDate: string
  lastModifiedTime: string
  hash: string
}

interface SheetInfoOut {
  name: string
  columns: string[]
}

interface FileReadResult {
  file: FileMetadata
  sheets: SheetInfoOut[]
}

interface PlanilhaInfo {
  fileName: string
  columns: string[]
}

function App() {
  const [planilhas, setPlanilhas] = useState<PlanilhaInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [resultado, setResultado] = useState<FileReadResult | null>(null)

  const toTwoDigits = (value: number) => value.toString().padStart(2, '0')

  const formatDateFromMs = (ms: number): string => {
    const d = new Date(ms)
    const year = d.getFullYear()
    const month = toTwoDigits(d.getMonth() + 1)
    const day = toTwoDigits(d.getDate())
    return `${year}-${month}-${day}`
  }

  const formatTimeFromMs = (ms: number): string => {
    const d = new Date(ms)
    const hh = toTwoDigits(d.getHours())
    const mm = toTwoDigits(d.getMinutes())
    const ss = toTwoDigits(d.getSeconds())
    return `${hh}:${mm}:${ss}`
  }

  const arrayBufferToHex = (buffer: ArrayBuffer): string => {
    const byteArray = new Uint8Array(buffer)
    const hexCodes: string[] = []
    for (let i = 0; i < byteArray.length; i++) {
      const hex = byteArray[i].toString(16).padStart(2, '0')
      hexCodes.push(hex)
    }
    return hexCodes.join('')
  }

  const sha256Hex = async (buffer: ArrayBuffer): Promise<string> => {
    try {
      const digest = await crypto.subtle.digest('SHA-256', buffer)
      return arrayBufferToHex(digest)
    } catch (e) {
      console.warn('SHA-256 não suportado, hash vazio retornado')
      return ''
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)

    try {
      // Configurar as opções para leitura rápida
      const options = {
        sheetRows: 1, // Ler apenas a primeira linha
        raw: false,
        cellFormula: false,
        cellHTML: false,
        cellStyles: false
      }

      // Ler o arquivo como array buffer para processamento mais rápido
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { ...options, type: 'array' })
      
      // Processar cada planilha
      const planilhasInfo = workbook.SheetNames.map(sheetName => {
        const worksheet = workbook.Sheets[sheetName]
        
        // Obter apenas a primeira linha que contém os cabeçalhos
        const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[]
        return {
          fileName: sheetName,
          columns: headers || []
        }
      })

      setPlanilhas(planilhasInfo)

      // Montar o objeto no formato solicitado
      const lastModifiedDate = formatDateFromMs(file.lastModified)
      const lastModifiedTime = formatTimeFromMs(file.lastModified)
      const hash = await sha256Hex(buffer)

      const resultadoObjeto: FileReadResult = {
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          lastModifiedDate,
          lastModifiedTime,
          hash
        },
        sheets: planilhasInfo.map(p => ({ name: p.fileName, columns: p.columns }))
      }

      setResultado(resultadoObjeto)
      console.log(JSON.stringify(resultadoObjeto))
    } catch (error) {
      console.error('Erro ao ler o arquivo:', error)
      alert('Erro ao processar o arquivo. Por favor, tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>Leitor Rápido de Planilhas Excel</h1>
      
      <div className="upload-section">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="file-input"
          disabled={isLoading}
        />
      </div>

      {isLoading && (
        <div className="loading">
          Processando arquivo...
        </div>
      )}

      {planilhas.length > 0 && !isLoading && (
        <div className="results-section">
          <h2>Planilhas Encontradas:</h2>
          <div className="sheets-list">
            {planilhas.map((planilha, index) => (
              <div key={index} className="sheet-card">
                <h3>{planilha.fileName}</h3>
                <div className="columns-section">
                  <h4>Colunas Encontradas: ({planilha.columns.length})</h4>
                  <ul className="column-list">
                    {planilha.columns.map((coluna, colIndex) => (
                      <li key={colIndex}>{coluna || `Coluna ${colIndex + 1}`}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {resultado && !isLoading && (
        <div className="results-section">
          <h2>JSON no formato solicitado:</h2>
          <pre>{JSON.stringify(resultado, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default App