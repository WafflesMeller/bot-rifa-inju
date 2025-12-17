import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

const supabase = createClient("TU_SUPABASE_URL", "TU_SUPABASE_ANON_KEY")

function App() {
  const [contactos, setContactos] = useState([])
  const [loading, setLoading] = useState(false)

  // Cargar contactos
  useEffect(() => {
    fetchContactos()
    // Suscripción en tiempo real para ver cambios de estado
    const channel = supabase.channel('contactos').on('postgres_changes', { event: '*', schema: 'public', table: 'contactos' }, payload => {
      fetchContactos()
    }).subscribe()
  }, [])

  async function fetchContactos() {
    const { data } = await supabase.from('contactos').select('*').order('id', { ascending: true })
    setContactos(data)
  }

  // Activar el Backend
  async function lanzarCampana() {
    if(!confirm("¿Seguro quieres iniciar el envío masivo?")) return;
    setLoading(true)
    try {
      await axios.post('http://localhost:3001/iniciar-campana')
      alert("Campaña iniciada. El bot está trabajando en segundo plano.")
    } catch (error) {
      alert("Error conectando con el bot")
    }
    setLoading(false)
  }

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-5">🔥 Flow La Guaira CRM</h1>
      
      <div className="flex justify-between mb-5">
        <p>Total Contactos: {contactos.length}</p>
        <button 
          onClick={lanzarCampana}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50">
          {loading ? "Procesando..." : "🚀 Iniciar Campaña"}
        </button>
      </div>

      <div className="border rounded shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Teléfono</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Mensaje IA</th>
            </tr>
          </thead>
          <tbody>
            {contactos.map(c => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.nombre}</td>
                <td className="p-3">{c.telefono}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    c.status === 'enviado' ? 'bg-green-100 text-green-800' : 
                    c.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {c.status.toUpperCase()}
                  </span>
                </td>
                <td className="p-3 text-sm text-gray-500 truncate max-w-xs">{c.mensaje_enviado || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default App