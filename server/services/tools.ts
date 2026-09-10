import fetch from 'node-fetch';
import fs from 'fs';
import os from 'os';
import path from 'path';
import sharp from 'sharp';
import { Jimp } from 'jimp';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { exec, execFile } from 'child_process';
import jsQR from 'jsqr';
import dns from 'dns';
import util from 'util';
import FormData from 'form-data';
import { PDFDocument } from 'pdf-lib';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
// Add any global imports you need here
export async function searchAndDownloadWithYtdlp(query: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    exec('which yt-dlp', (err, stdout) => {
      if (err || !stdout.trim()) {
        console.log('[Play] yt-dlp is not available locally.');
        return resolve(null);
      }

      const runId = Date.now();
      const tempPattern = path.join(os.tmpdir(), `ytdl_${runId}`);
      const args = [
        '-f', 'ba',
        '-x',
        '--audio-format', 'mp3',
        '--match-filter', 'duration <= 600',
        '-o', `${tempPattern}.%(ext)s`,
        `ytsearch1:${query}`
      ];
      
      console.log(`[Play] Executing local yt-dlp search & download: yt-dlp ${args.join(' ')}`);
      execFile('yt-dlp', args, { timeout: 120000 }, (execErr) => {
        if (execErr) {
          console.warn('[Play] Local yt-dlp download failed:', execErr);
          return resolve(null);
        }

        const expectedFile = `${tempPattern}.mp3`;
        try {
          if (fs.existsSync(expectedFile)) {
            const buffer = fs.readFileSync(expectedFile);
            fs.unlinkSync(expectedFile); // clean up
            return resolve(buffer);
          } else {
            // Check for files with matching prefixes in tmp directory as fallback
            const files = fs.readdirSync(os.tmpdir());
            const matchedFile = files.find(f => f.startsWith(`ytdl_${runId}`));
            if (matchedFile) {
              const fullPath = path.join(os.tmpdir(), matchedFile);
              const buffer = fs.readFileSync(fullPath);
              fs.unlinkSync(fullPath);
              return resolve(buffer);
            }
            console.warn('[Play] yt-dlp output file not found:', expectedFile);
            return resolve(null);
          }
        } catch (e) {
          console.error('[Play] Error reading local yt-dlp audio:', e);
          return resolve(null);
        }
      });
    });
  });
}

export async function removeBgWithLocalRembg(imageBuffer: Buffer): Promise<Buffer | null> {
  return new Promise((resolve) => {
    exec('which rembg', async (err, stdout) => {
      if (err || !stdout.trim()) {
        console.log('[RemoveBG] rembg CLI is not available.');
        return resolve(null);
      }

      const tempIn = path.join(os.tmpdir(), `rembg_in_${Date.now()}.jpg`);
      const tempOut = path.join(os.tmpdir(), `rembg_out_${Date.now()}.png`);

      try {
        await fs.promises.writeFile(tempIn, imageBuffer);
        const cmd = `rembg i "${tempIn}" "${tempOut}"`;
        console.log(`[RemoveBG] Executing local rembg CLI: ${cmd}`);
        
        exec(cmd, async (execErr) => {
          if (execErr) {
            console.warn('[RemoveBG] rembg failed:', execErr);
            cleanup();
            return resolve(null);
          }

          if (fs.existsSync(tempOut)) {
            const buffer = await fs.promises.readFile(tempOut);
            cleanup();
            return resolve(buffer);
          } else {
            console.warn('[RemoveBG] rembg completed but output file not found.');
            cleanup();
            return resolve(null);
          }
        });
      } catch (e) {
        console.error('[RemoveBG] rembg exception:', e);
        cleanup();
        return resolve(null);
      }

      function cleanup() {
        try { if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn); } catch {}
        try { if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut); } catch {}
      }
    });
  });
}

export async function decodeQrFromBuffer(buffer: Buffer): Promise<string | null> {
  try {
    const jsQRFunc: any = (jsQR as any).default || jsQR;

    const image = await Jimp.read(buffer);
    const { data, width, height } = image.bitmap;
    
    const code = jsQRFunc(new Uint8ClampedArray(data), width, height);
    if (code && code.data) {
      return code.data;
    }
  } catch (err) {
    console.error('QR Decode Error:', err);
  }
  return null;
}

export async function trimVideoIfNecessary(buffer: Buffer): Promise<Buffer> {
  const tempIn = path.join(os.tmpdir(), `sticker_in_${Date.now()}.mp4`);
  const tempOut = path.join(os.tmpdir(), `sticker_out_${Date.now()}.mp4`);
  try {
    await fs.promises.writeFile(tempIn, buffer);
    const cmd = `ffmpeg -y -i "${tempIn}" -t 10 -preset ultrafast -an "${tempOut}"`;
    await new Promise<void>((resolve, reject) => {
      exec(cmd, (err) => {
        if (err) resolve(); // Continue even if ffmpeg has an issue
        else resolve();
      });
    });

    if (fs.existsSync(tempOut)) {
      const outBuffer = await fs.promises.readFile(tempOut);
      return outBuffer;
    }
    return buffer;
  } catch (err) {
    console.warn('[Sticker] Failed to trim video using ffmpeg, passing raw buffer instead:', err);
    return buffer;
  } finally {
    try { if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn); } catch {}
    try { if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut); } catch {}
  }
}

export async function uploadToCatbox(buffer: Buffer, filename: string, mimeType: string): Promise<string | null> {
  try {
    const axios = require('axios');
    const FormData = require('form-data');
    const fd = new FormData();
    fd.append('reqtype', 'fileupload');
    fd.append('fileToUpload', buffer, { filename: filename || 'file.bin', contentType: mimeType });
    const res = await axios.post('https://catbox.moe/user/api.php', fd, { headers: fd.getHeaders() });
    if (res.status === 200 && typeof res.data === 'string' && res.data.startsWith('https://')) return res.data.trim();
  } catch (err) { }
  return null;
}

export async function uploadToLitterbox(buffer: Buffer, filename: string, mimeType: string): Promise<string | null> {
  try {
    const axios = require('axios');
    const FormData = require('form-data');
    const fd = new FormData();
    fd.append('reqtype', 'fileupload');
    fd.append('time', '12h');
    fd.append('fileToUpload', buffer, { filename: filename || 'file.bin', contentType: mimeType });
    const res = await axios.post('https://litterbox.catbox.moe/resources/internals/api.php', fd, { headers: fd.getHeaders() });
    if (res.status === 200 && typeof res.data === 'string' && res.data.startsWith('https://')) return res.data.trim();
  } catch (err) { }
  return null;
}

export async function searchYoutube(query: string): Promise<{ url: string; title: string, durationSec: number } | null> {
  try {
    const searchUrl = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
    const response = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36' }
    });
    if (!response.ok) return null;
    const html = await response.text();
    const match = html.match(/var ytInitialData\s*=\s*(.*?);\s*<\/script>/) || html.match(/window\["ytInitialData"]\s*=\s*(.*?);\s*<\/script>/);
    if (match) {
      try {
        const json = JSON.parse(match[1]);
        const contents = json.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
        if (contents && Array.isArray(contents)) {
          for (const item of contents) {
            if (item.videoRenderer) {
              const videoId = item.videoRenderer.videoId;
              const title = item.videoRenderer.title?.runs?.[0]?.text || item.videoRenderer.title?.simpleText || '';
              if (videoId) {
                return { url: 'https://www.youtube.com/watch?v=' + videoId, title, durationSec: 180 };
              }
            }
          }
        }
      } catch (e) {
      }
    }
    const watchMatch = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch && watchMatch[1]) {
      return { url: 'https://www.youtube.com/watch?v=' + watchMatch[1], title: 'YouTube Audio', durationSec: 180 };
    }
  } catch (err) {}
  return null;
}


export async function compressImageBuffer(buffer: Buffer): Promise<Buffer> {
  try {
    const img = sharp(buffer);
    const metadata = await img.metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    
    let resized = img;
    if (width > 1280 || height > 1280) {
      if (width > height) {
        resized = img.resize({ width: 1280 });
      } else {
        resized = img.resize({ height: 1280 });
      }
    }
    
    return await resized.jpeg({ quality: 70 }).toBuffer();
  } catch (err) {
    console.error('[Compress] Failed to compress photo with sharp:', err);
    return buffer;
  }
}

export async function compressVideoBuffer(buffer: Buffer): Promise<Buffer> {
  const tempIn = path.join(os.tmpdir(), `compress_in_${Date.now()}.mp4`);
  const tempOut = path.join(os.tmpdir(), `compress_out_${Date.now()}.mp4`);
  try {
    await fs.promises.writeFile(tempIn, buffer);
    const cmd = `ffmpeg -y -i "${tempIn}" -vf "scale=-2:'min(720,ih)'" -b:v 1M -preset fast -vcodec libx264 -acodec aac "${tempOut}"`;
    await new Promise<void>((resolve, reject) => {
      exec(cmd, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (fs.existsSync(tempOut)) {
      const outBuffer = await fs.promises.readFile(tempOut);
      return outBuffer;
    }
    return buffer;
  } catch (err) {
    console.warn('[Compress] Failed to compress video with ffmpeg:', err);
    return buffer;
  } finally {
    try { if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn); } catch {}
    try { if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut); } catch {}
  }
}

export async function createTextSticker(text: string): Promise<Buffer> {
  const svgText = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.8"/>
        </filter>
      </defs>
      <style>
        .text {
          font-family: "Impact", "Arial Black", sans-serif;
          font-size: 42px;
          fill: #ffffff;
          stroke: #000000;
          stroke-width: 10px;
          stroke-linejoin: round;
          paint-order: stroke fill;
          text-anchor: middle;
          filter: url(#shadow);
          font-weight: bold;
        }
      </style>
      <g transform="translate(256, 120)">
        ${text.split('\n').map((line, idx) => `
          <text x="0" y="${idx * 60}" class="text">${line.toUpperCase()}</text>
        `).join('')}
      </g>
    </svg>
  `;
  return Buffer.from(svgText);
}

export async function convertMultipleImagesToPdf(imageBuffers: Buffer[]): Promise<Buffer | null> {
  try {
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    
    for (const imageBuffer of imageBuffers) {
      let image;
      try {
        image = await pdfDoc.embedJpg(imageBuffer);
      } catch {
        try {
          image = await pdfDoc.embedPng(imageBuffer);
        } catch {
          const convertedJpg = await sharp(imageBuffer).jpeg().toBuffer();
          image = await pdfDoc.embedJpg(convertedJpg);
        }
      }
      
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
    }
    
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (err) {
    console.error('[PDF] Convert Multiple Images error:', err);
    return null;
  }
}

export async function convertImageToPdf(imageBuffer: Buffer): Promise<Buffer | null> {
  return convertMultipleImagesToPdf([imageBuffer]);
}

export async function convertPdfToImage(pdfBuffer: Buffer): Promise<Buffer | null> {
  try {
    const pngBuffer = await sharp(pdfBuffer, { page: 0, density: 154 }).png().toBuffer();
    return pngBuffer;
  } catch (err) {
    console.error('[PDF] PDF to Image sharp error, trying extract...', err);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(pdfBuffer);
    } catch {}
    return null;
  }
}

export async function getPdfInfo(pdfBuffer: Buffer, fileName: string = 'document.pdf'): Promise<string | null> {
  try {
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPageCount();
    const title = pdfDoc.getTitle() || fileName;
    const author = pdfDoc.getAuthor() || 'Unknown';
    const creator = pdfDoc.getCreator() || 'Unknown';
    const creationDate = pdfDoc.getCreationDate() ? pdfDoc.getCreationDate()?.toLocaleString() : 'Unknown';
    const sizeKb = (pdfBuffer.length / 1024).toFixed(2);
    
    return `📄 *PDF FILE INFO*
- *File Name*: ${title}
- *File Size*: ${sizeKb} KB
- *Pages*: ${pages} Pages
- *Created Date*: ${creationDate}
- *Creator*: ${creator}
- *Author*: ${author}`;
  } catch (err) {
    console.error('[PDF] Info error:', err);
    return null;
  }
}

export async function translateText(text: string, targetLang: string): Promise<string | null> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && data[0]) {
        return data[0].map((part: any) => part[0]).filter(Boolean).join(' ');
      }
    }
  } catch (err) {
    console.error('[Translate] Google API error:', err);
  }
  
  try {
    const res = await fetch('https://translate.argosopentech.com/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source: 'auto', target: targetLang })
    });
    if (res.ok) {
      const data: any = await res.json();
      return data.translatedText || null;
    }
  } catch (err) {
    console.error('[Translate] LibreTranslate error:', err);
  }
  return null;
}

export async function bedahFileDetails(msg: any, quotedMsg: any): Promise<string | null> {
  const target = msg.message?.imageMessage || msg.message?.videoMessage || msg.message?.audioMessage || msg.message?.documentMessage || msg.message?.stickerMessage ||
                 quotedMsg?.imageMessage || quotedMsg?.videoMessage || quotedMsg?.audioMessage || quotedMsg?.documentMessage || quotedMsg?.stickerMessage;
                 
  if (!target) return null;
  
  let type = 'Dokumen/File';
  let name = target.fileName || 'Tidak diketahui';
  let sizeBytes = Number(target.fileLength || 0);
  let sizeStr = sizeBytes ? `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB (${(sizeBytes / 1024).toFixed(2)} KB)` : 'Tidak diketahui';
  let mime = target.mimetype || 'application/octet-stream';
  let extraInfo = '';
  
  if (target.width && target.height) {
    extraInfo += `- *Resolusi*: ${target.width} x ${target.height} px\n`;
  }
  
  if (target.seconds) {
    const duration = target.seconds;
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const durationStr = `${mins}:${secs.toString().padStart(2, '0')} (${duration} detik)`;
    extraInfo += `- *Durasi*: ${durationStr}\n`;
    if (sizeBytes) {
      const bitrateKbps = Math.round((sizeBytes * 8) / (duration * 1000));
      extraInfo += `- *Bitrate*: ~${bitrateKbps} kbps\n`;
    }
  }
  
  if (target.gifPlayback) {
    extraInfo += `- *Tipe*: GIF Animasi\n`;
  }
  
  if (name.toLowerCase().endsWith('.pdf') || mime === 'application/pdf') {
    type = 'Adobe PDF';
    try {
      const stream = await downloadContentFromMessage(target, 'document');
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(buffer);
      extraInfo += `- *Jumlah Halaman*: ${pdfDoc.getPageCount()} halaman\n`;
    } catch {}
  } else if (name.toLowerCase().endsWith('.zip') || mime.includes('zip')) {
    type = 'ZIP Archive';
  } else if (name.toLowerCase().endsWith('.apk')) {
    type = 'Android Package (APK)';
  } else if (target.mimetype?.startsWith('image/')) {
    type = 'Gambar (Image)';
    if (name === 'Tidak diketahui') name = 'image.jpg';
  } else if (target.mimetype?.startsWith('video/')) {
    type = 'Video (Media)';
    if (name === 'Tidak diketahui') name = 'video.mp4';
    extraInfo += `- *FPS*: ~30 fps\n`;
  } else if (target.mimetype?.startsWith('audio/')) {
    type = 'Audio / Voice Note';
    if (name === 'Tidak diketahui') name = 'audio.mp3';
  }
  
  return `📁 *FILE INSPECTOR DETAIL*
- *Nama*: ${name}
- *Kategori*: ${type}
- *Ukuran*: ${sizeStr}
- *Mime Type*: ${mime}
${extraInfo}`.trim();
}

export async function shortenUrl(longUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
    if (res.ok) {
      const url = await res.text();
      if (url && url.startsWith('http')) return url.trim();
    }
  } catch (err) {
    console.error('[ShortURL] TinyURL error:', err);
  }
  
  try {
    const res = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(longUrl)}`);
    if (res.ok) {
      const url = await res.text();
      if (url && url.startsWith('http')) return url.trim();
    }
  } catch (err) {
    console.error('[ShortURL] is.gd error:', err);
  }
  
  try {
    const res = await fetch('https://cleanuri.com/api/v1/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `url=${encodeURIComponent(longUrl)}`
    });
    if (res.ok) {
      const data: any = await res.json();
      if (data && data.result_url) return data.result_url;
    }
  } catch (err) {
    console.error('[ShortURL] Cleanuri error:', err);
  }
  return null;
}

export async function removeBackgroundViaHF(imageBuffer: Buffer, contentType: string = 'image/jpeg'): Promise<Buffer | null> {
  
  try {
    const token = process.env.HF_TOKEN || '';
    const headers: Record<string, string> = {
      'Content-Type': contentType,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('https://api-inference.huggingface.co/models/briaai/RMBG-1.4', {
      method: 'POST',
      headers,
      body: imageBuffer
    });

    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } else {
      const errorText = await response.text();
      console.error( `[RemoveBG] HF API error response status: ${response.status} ${errorText}`);
    }
  } catch (err: any) {
    console.error();
  }
  return null;
}

export async function downloadSocialMedia(mediaUrl: string, isAudioOnly: boolean = false): Promise<{ type: 'video' | 'audio' | 'image'; buffer: Buffer; filename: string } | null> {
  const cleanUrl = mediaUrl.trim();
  
  // Daftar Cobalt API endpoint aktif sebagai pertahanan berlapis (redundant mirrors)
  const endpoints = [
    'https://api.cobalt.tools/api/json',
    'https://cobalt.tools/api/json',
    'https://cobalt.k6.tf/api/json'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`[Downloader] Mencoba mengunduh via Cobalt host: ${endpoint} untuk ${cleanUrl}...`);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Accept': 'application/json', 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          url: cleanUrl, 
          isAudioOnly: isAudioOnly,
          downloadMode: isAudioOnly ? 'audio' : 'video',
          videoQuality: '720' // Resolusi aman dan lincah
        })
      });

      if (!res.ok) {
        console.warn(`[Downloader] Mirror ${endpoint} mengembalikan HTTP ${res.status}`);
        continue;
      }

      const json = await res.json() as any;
      if (json && json.status !== 'error') {
        const downloadUrl = json.url || (json.picker && Array.isArray(json.picker) && json.picker[0]?.url);
        if (downloadUrl) {
          console.log(`[Downloader] Berhasil mendapat unduhan dari ${endpoint} -> ${downloadUrl}. Mengunduh stream binary...`);
          const bufRes = await fetch(downloadUrl);
          if (bufRes.ok) {
            return {
              type: isAudioOnly ? 'audio' : 'video',
              buffer: Buffer.from(await bufRes.arrayBuffer()),
              filename: isAudioOnly ? 'audio.mp3' : 'video.mp4'
            };
          }
        }
      }
    } catch (e: any) {
      console.warn(`[Downloader] Gagal saat mencoba host ${endpoint}:`, e.message || e);
    }
  }

  console.error('[Downloader] Seluruh alternatif Cobalt API gagal untuk URL:', cleanUrl);
  return null;
}