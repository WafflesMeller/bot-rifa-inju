import React, { useState } from 'react';
// 1. IMPORTANTE: Agregamos callStartCampaign aquí
import { callGenerate, callSupabaseTest, callStartCampaign } from './api';

export default function App() {
  const [prompt, setPrompt] = useState('');
  
  // Respuestas de las pruebas
  const [resp, setResp] = useState(null);
  const [supResp, setSupResp] = useState(null);

  // 2. NUEVO ESTADO: Para saber qué pasa con la campaña
  const [campaignStatus, setCampaignStatus] = useState('');

  async function onGenerate(e) {
    e.preventDefault();
    setResp("Generando..."); // Feedback visual
    const r = await callGenerate(prompt);
    setResp(r);
  }

  async function onSupabaseTest() {
    setSupResp("Conectando...");
    const r = await callSupabaseTest();
    setSupResp(r);
  }

  // --- FUNCIÓN CORREGIDA: INICIAR CAMPAÑA ---
  const handleCampaign = async () => {
    if (!confirm("⚠️ ¿Seguro que quieres enviar mensajes a la lista de espera?")) return;
    
    // Usamos la variable nueva campaignStatus
    setCampaignStatus("🚀 Iniciando campaña... Revisa la terminal del Backend.");
    
    try {
      const data = await callStartCampaign();
      setCampaignStatus("✅ Éxito: " + data.message);
    } catch (e) {
      setCampaignStatus("❌ Error lanzando campaña. ¿El backend está corriendo?");
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>🤖 Bot Rifa Flow La Guaira</h1>

      {/* SECCIÓN 1: PROBAR IA */}
      <div style={{ border: '1px solid #ccc', padding: 10, marginBottom: 10, borderRadius: 8 }}>
        <h3>1. Prueba de Inteligencia (IA)</h3>
        <form onSubmit={onGenerate}>
          <input 
            value={prompt} 
            onChange={(e) => setPrompt(e.target.value)} 
            placeholder="Escribe un prompt..." 
            style={{ width: '70%', padding: 5 }}
          />
          <button type="submit" style={{ marginLeft: 5 }}>Generar</button>
        </form>
        <pre style={{ background: '#f0f0f0', padding: 10 }}>
            {resp ? JSON.stringify(resp, null, 2) : 'Esperando instrucción...'}
        </pre>
      </div>

      {/* SECCIÓN 2: PROBAR BASE DE DATOS */}
      <div style={{ border: '1px solid #ccc', padding: 10, marginBottom: 10, borderRadius: 8 }}>
        <h3>2. Prueba de Base de Datos</h3>
        <button onClick={onSupabaseTest}>Verificar Conexión Supabase</button>
        <pre style={{ background: '#f0f0f0', padding: 10 }}>
            {supResp ? JSON.stringify(supResp, null, 2) : 'Sin verificar'}
        </pre>
      </div>

      {/* SECCIÓN 3: LANZAR CAMPAÑA (Lo Nuevo) */}
      <div style={{ border: '2px solid red', padding: 10, borderRadius: 8, backgroundColor: '#fff0f0' }}>
        <h3 style={{ color: 'red' }}>3. ZONA DE PELIGRO: CAMPAÑA WHATSAPP</h3>
        <p>Esto enviará mensajes reales a los contactos "pendientes".</p>
        
        <button 
            onClick={handleCampaign} 
            style={{ 
                backgroundColor: 'red', 
                color: 'white', 
                padding: '10px 20px', 
                border: 'none', 
                borderRadius: 5, 
                cursor: 'pointer',
                fontWeight: 'bold'
            }}
        >
            🚀 INICIAR CAMPAÑA
        </button>

        <p style={{ fontWeight: 'bold', marginTop: 10 }}>
            Estado: {campaignStatus || "Esperando orden..."}
        </p>
      </div>

    </div>
  );
}