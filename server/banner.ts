import { Jimp, loadFont } from 'jimp';
import { SANS_32_WHITE, SANS_16_WHITE } from 'jimp/fonts';

// Simple helper to generate a welcome image using Jimp
export async function generateWelcomeBanner(name: string, pfpUrl?: string): Promise<Buffer> {
  // Create a 800x400 aesthetic background (Gradient or Hex color)
  // We'll use a solid color base and add a pattern or just nice color
  const width = 800;
  const height = 400;
  const bg = new Jimp({ width, height, color: 0x1A1A2eff }); // Dark blue-ish background
  
  // Try to load user profile picture
  let pfp: any;
  if (pfpUrl) {
    try {
      pfp = await Jimp.read(pfpUrl);
      // Resize to 150x150
      pfp = pfp.resize({ w: 150, h: 150 });
      // Draw a circle mask natively with Jimp? 
      // Jimp v1: .circle()
      pfp.circle();
    } catch(err) {
      console.warn("Failed to load or process profile picture for banner:", err);
      pfp = null;
    }
  }
  
  // Font loading
  try {
    const fontTitle = await loadFont(SANS_32_WHITE);
    // Draw welcome title
    bg.print({ font: fontTitle, x: 50, y: 50, text: "Welcome to" });
    
    // Draw user name below it
    // @ts-ignore
    bg.print({ font: fontTitle, x: 50, y: 100, text: name });

    // Place PFP if exists
    if (pfp) {
      bg.composite(pfp, width - 200, (height - 150) / 2);
    }
  } catch (err) {
    console.error("Failed to load fonts for banner:", err);
  }

  // Get buffer
  const buffer = await bg.getBuffer('image/jpeg', { quality: 80 });
  return buffer;
}
