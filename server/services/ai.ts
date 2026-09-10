import fetch from 'node-fetch';
import { GoogleGenAI } from '@google/genai';

export async function generateWithOpenRouter(apiKey: string, systemPrompt: string, userPrompt: string, preferredModel: string): Promise<string> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai.studio/build',
        'X-Title': 'FanraBot'
      },
      body: JSON.stringify({
        model: preferredModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API Error (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error: any) {
    throw new Error(`OpenRouter Exception: ${error.message || error}`);
  }
}


export async function checkToxicityWithAI(text: string, providers: any[]): Promise<boolean> {
  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const geminiProvider = providers.find((p: any) => p.id === 'gemini' && p.apiKey && p.apiKey.length > 10 && !p.disabled);
    if (geminiProvider) apiKey = geminiProvider.apiKey;
  }

  if (!apiKey) {
    return false; // Backup to static list if Gemini is unavailable
  }
  
  try {
    const aiInstance = new GoogleGenAI({ 
      apiKey: apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
    
    const prompt = "Analisis teks berikut secara kontekstual. Evaluasi apakah pesan ini mengandung unsur **toksisitas tinggi, perundungan, ujaran kebencian, makian kasar, atau kata plesetan kotor**.\nJawab HANYA dengan 'TRUE' jika mendeteksi badword atau konteks toksik, dan 'FALSE' jika aman.\nPesan: " + text;

    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 10,
        temperature: 0.1
      }
    });
    
    const output = response.text?.trim().toUpperCase();
    return output?.includes("TRUE") || false;
  } catch(e) {
    console.error("[AntiBadword] AI check failed:", e);
    return false;
  }
}

export async function generateWithGemini(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  if (apiKey && apiKey.startsWith('sk-or-v1')) {
    return generateWithOpenRouter(apiKey, systemPrompt, userPrompt, 'google/gemini-2.5-flash');
  }
  const aiInstance = new GoogleGenAI({ 
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  const response = await aiInstance.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { role: 'user', parts: [{ text: `Instruction:\n${systemPrompt}\n\nClient Message:\n${userPrompt}` }] }
    ]
  });
  return response.text || '';
}

export async function generateWithGroq(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  if (apiKey && apiKey.startsWith('sk-or-v1')) {
    return generateWithOpenRouter(apiKey, systemPrompt, userPrompt, 'meta-llama/llama-3.3-70b-instruct');
  }
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1024
    })
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API Error (${response.status}): ${errText}`);
  }
  
  const data: any = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function generateWithOpenAI(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  if (apiKey && apiKey.startsWith('sk-or-v1')) {
    return generateWithOpenRouter(apiKey, systemPrompt, userPrompt, 'openai/gpt-4o-mini');
  }
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1024
    })
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API Error (${response.status}): ${errText}`);
  }
  
  const data: any = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function generateWithDeepSeek(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1024
    })
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepSeek API Error (${response.status}): ${errText}`);
  }
  
  const data: any = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function generateWithAnthropic(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  if (apiKey && apiKey.startsWith('sk-or-v1')) {
    return generateWithOpenRouter(apiKey, systemPrompt, userPrompt, 'anthropic/claude-3.5-haiku');
  }
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1024,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API Error (${response.status}): ${errText}`);
  }
  
  const data: any = await response.json();
  return data.content?.[0]?.text || '';
}

export async function generateWithKimi(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const cleanKey = apiKey.trim();
  if (!cleanKey.startsWith('sk-')) {
    throw new Error('API Key Kimi tidak valid (Harus berawalan sk-). Harap gunakan key dari platform.moonshot.cn');
  }
  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cleanKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'moonshot-v1-8k',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1024
    })
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Kimi API Error (${response.status}): ${errText}`);
  }
  
  const data: any = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function testOpenRouterKey(apiKey: string, fallbackModel: string, providerLabel: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai.studio/build',
        'X-Title': 'FanraBot'
      },
      body: JSON.stringify({
        model: fallbackModel,
        messages: [{ role: 'user', content: 'say ok' }],
        max_tokens: 5
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      let parsed: any;
      try { parsed = JSON.parse(errText); } catch(e) {}
      const errMsg = parsed?.error?.message || errText || `HTTP ${response.status}`;
      throw new Error(`OpenRouter API Error (${response.status}): ${errMsg}`);
    }
    return { success: true, message: `API Key valid dan berhasil terkoneksi ke ${providerLabel} via OpenRouter.` };
  } catch (error: any) {
    throw new Error(`OpenRouter Exception: ${error.message || error}`);
  }
}

export async function testProviderKeyReal(providerId: string, apiKey: string, selectedModel?: string): Promise<{ success: boolean; message: string }> {
  const cleanKey = apiKey.trim();
  if (providerId === 'gemini') {
    if (cleanKey.startsWith('sk-or-v1')) {
      return await testOpenRouterKey(cleanKey, 'google/gemini-2.5-flash', 'Gemini');
    }
    const aiInstance = new GoogleGenAI({ 
      apiKey: cleanKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'say OK'
    });
    if (response && response.text) {
      return { success: true, message: 'API Key valid dan berhasil terkoneksi ke Google Gemini.' };
    }
    throw new Error('Respons kosong/tidak valid dari asisten Gemini.');
  }

  if (providerId === 'groq') {
    if (cleanKey.startsWith('sk-or-v1')) {
      return await testOpenRouterKey(cleanKey, 'meta-llama/llama-3.3-70b-instruct', 'Groq');
    }
    const testModel = selectedModel || 'llama-3.1-8b-instant';
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cleanKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: testModel,
        messages: [{ role: 'user', content: 'say ok' }],
        max_tokens: 5
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      let parsed: any;
      try { parsed = JSON.parse(errText); } catch(e) {}
      const errMsg = parsed?.error?.message || errText || `HTTP ${response.status}`;
      throw new Error(`Groq API Error (${response.status}): ${errMsg}`);
    }
    return { success: true, message: `API Key valid dan berhasil terkoneksi ke Groq (Menggunakan model: ${testModel}).` };
  }

  if (providerId === 'openai') {
    if (cleanKey.startsWith('sk-or-v1')) {
      return await testOpenRouterKey(cleanKey, 'openai/gpt-4o-mini', 'OpenAI');
    }
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cleanKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'say ok' }],
        max_tokens: 5
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      let parsed: any;
      try { parsed = JSON.parse(errText); } catch(e) {}
      const errMsg = parsed?.error?.message || errText || `HTTP ${response.status}`;
      throw new Error(`OpenAI API Error (${response.status}): ${errMsg}`);
    }
    return { success: true, message: 'API Key valid dan berhasil terkoneksi ke OpenAI.' };
  }

  if (providerId === 'anthropic') {
    if (cleanKey.startsWith('sk-or-v1')) {
      return await testOpenRouterKey(cleanKey, 'anthropic/claude-3.5-haiku', 'Anthropic');
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': cleanKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        messages: [{ role: 'user', content: 'say ok' }],
        max_tokens: 5
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      let parsed: any;
      try { parsed = JSON.parse(errText); } catch(e) {}
      const errMsg = parsed?.error?.message || errText || `HTTP ${response.status}`;
      throw new Error(`Anthropic API Error (${response.status}): ${errMsg}`);
    }
    return { success: true, message: 'API Key valid dan berhasil terkoneksi ke Anthropic.' };
  }

  if (providerId === 'deepseek') {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cleanKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'say ok' }],
        max_tokens: 5
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      let parsed: any;
      try { parsed = JSON.parse(errText); } catch(e) {}
      const errMsg = parsed?.error?.message || errText || `HTTP ${response.status}`;
      throw new Error(`DeepSeek API Error (${response.status}): ${errMsg}`);
    }
    return { success: true, message: 'API Key valid dan berhasil terkoneksi ke DeepSeek.' };
  }

  if (providerId === 'kimi') {
    if (!cleanKey.startsWith('sk-')) {
      throw new Error('API Key tidak valid. Pastikan Anda mengambil API Key dari platform.moonshot.cn (Developer API), bukan dari inspector web Kimi.');
    }
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cleanKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [{ role: 'user', content: 'say ok' }],
        max_tokens: 5
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      let parsed: any;
      try { parsed = JSON.parse(errText); } catch(e) {}
      const errMsg = parsed?.error?.message || errText || `HTTP ${response.status}`;
      throw new Error(`Kimi API Error (${response.status}): ${errMsg}`);
    }
    return { success: true, message: 'API Key valid dan berhasil terkoneksi ke Kimi.' };
  }

  throw new Error(`Provider ID ${providerId} tidak dikenal.`);
}