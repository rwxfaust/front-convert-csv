import { useState } from 'react'
import * as XLSX from 'xlsx'
import './App.css'

interface PlanilhaInfo {
  nome: string
  colunas: string[]
}

function App() {
  const [planilhas, setPlanilhas] = useState<PlanilhaInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)

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

        console.log(JSON.stringify({
          nome: sheetName,
          colunas: headers || []
        }));
        return {
          nome: sheetName,
          colunas: headers || []
        }
      })

      setPlanilhas(planilhasInfo)
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
                <h3>{planilha.nome}</h3>
                <div className="columns-section">
                  <h4>Colunas Encontradas: ({planilha.colunas.length})</h4>
                  <ul className="column-list">
                    {planilha.colunas.map((coluna, colIndex) => (
                      <li key={colIndex}>{coluna || `Coluna ${colIndex + 1}`}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App