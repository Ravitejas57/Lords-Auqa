#!/usr/bin/env node
/**
 * Add padding to app icon to prevent cropping by Android adaptive icons.
 * This script creates a 1024x1024 PNG with the logo centered and taking up 60-70% of the canvas.
 *
 * Usage: node add_icon_padding.js
 */

const sharp = require('sharp');
const path = require('path');

async function addPaddingToIcon() {
  const inputPath = path.join(__dirname, 'assets', 'images', 'icon.png');
  const outputPath = path.join(__dirname, 'assets', 'images', 'icon-padded.png');

  const canvasSize = 1024;
  const logoPercentage = 0.65; // 65% of canvas

  try {
    // Get original image metadata
    const metadata = await sharp(inputPath).metadata();
    console.log(`Original icon: ${metadata.width}x${metadata.height}`);

    // Calculate the size the logo should be
    const logoSize = Math.floor(canvasSize * logoPercentage);

    // Resize the logo proportionally (maintain aspect ratio)
    const resizedLogo = await sharp(inputPath)
      .resize(logoSize, logoSize, {
        fit: 'inside',
        withoutEnlargement: false
      })
      .toBuffer();

    // Get the actual dimensions after resize
    const resizedMeta = await sharp(resizedLogo).metadata();

    // Calculate padding to center the logo
    const xOffset = Math.floor((canvasSize - resizedMeta.width) / 2);
    const yOffset = Math.floor((canvasSize - resizedMeta.height) / 2);

    // Create the padded icon with transparent background
    await sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([{
      input: resizedLogo,
      top: yOffset,
      left: xOffset
    }])
    .png()
    .toFile(outputPath);

    console.log('✓ Padded icon created successfully!');
    console.log(`  Logo size: ${resizedMeta.width}x${resizedMeta.height}`);
    console.log(`  Canvas size: ${canvasSize}x${canvasSize}`);
    console.log(`  Logo occupies: ${(logoPercentage * 100).toFixed(0)}% of canvas`);
    console.log(`  Saved to: ${outputPath}`);
    console.log('\nNext steps:');
    console.log('1. Preview the padded icon: assets/images/icon-padded.png');
    console.log('2. If satisfied, replace the original icon or update app.json');
    console.log('3. Or adjust logoPercentage in the script and run again');

  } catch (error) {
    console.error('Error creating padded icon:', error.message);

    if (error.message.includes('sharp')) {
      console.log('\nInstalling required package: sharp');
      console.log('Run: npm install sharp --save-dev');
    }

    process.exit(1);
  }
}

addPaddingToIcon();
