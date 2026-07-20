import sharp from "sharp";
import { mkdir } from "fs/promises";

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#3b82f6"/>
  <path d="M160 260l60 60 140-140" stroke="white" stroke-width="48" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

await mkdir("public/icons", { recursive: true });

await sharp(Buffer.from(svgIcon)).resize(192, 192).png().toFile("public/icons/icon-192.png");
console.log("OK: icon-192.png");

await sharp(Buffer.from(svgIcon)).resize(512, 512).png().toFile("public/icons/icon-512.png");
console.log("OK: icon-512.png");
