export default async function handler(request, response) {
  try {
    // 🟢 COLOQUE AQUI A URL REAL DO SEU RENDER (A mesma que você usa no Front-end)
    // Lembre-se de colocar /health no final!
    const URL_DO_SEU_RENDER = "https://sua-api.onrender.com/health";
    
    // Faz a batida na porta do Render
    const res = await fetch(URL_DO_SEU_RENDER);
    const data = await res.json();
    
    // Responde para a Vercel que deu tudo certo
    return response.status(200).json({ 
      message: "O Render foi acordado com sucesso! ⚡", 
      render_status: data 
    });
  } catch (error) {
    return response.status(500).json({ error: "Falha ao acordar o Render." });
  }
}