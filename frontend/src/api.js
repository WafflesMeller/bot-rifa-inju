const BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export async function callGenerate(prompt) {
  const res = await fetch(`${BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  return await res.json();
}

export async function callSupabaseTest() {
  const res = await fetch(`${BASE}/api/supabase-test`);
  return await res.json();
}

export async function callStartCampaign() {
  // Llamamos al endpoint que creamos en el backend
  const res = await fetch(`${BASE}/iniciar-campana`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return await res.json();
}