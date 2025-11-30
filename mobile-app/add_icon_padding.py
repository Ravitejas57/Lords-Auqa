#!/usr/bin/env python3
"""
Add padding to app icon to prevent cropping by Android adaptive icons.
This script creates a 1024x1024 PNG with the logo centered and taking up 60-70% of the canvas.
"""

from PIL import Image
import os

def add_padding_to_icon(input_path, output_path, canvas_size=1024, logo_percentage=0.65):
    """
    Add padding around an app icon.

    Args:
        input_path: Path to the original icon
        output_path: Path to save the padded icon
        canvas_size: Size of the output canvas (default 1024x1024)
        logo_percentage: Percentage of canvas the logo should occupy (default 0.65 = 65%)
    """
    # Open the original icon
    original = Image.open(input_path)

    # Convert to RGBA if not already
    if original.mode != 'RGBA':
        original = original.convert('RGBA')

    # Calculate the size the logo should be (65% of canvas)
    logo_size = int(canvas_size * logo_percentage)

    # Resize the logo proportionally
    original.thumbnail((logo_size, logo_size), Image.Resampling.LANCZOS)

    # Create a new transparent canvas
    padded = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))

    # Calculate position to center the logo
    x_offset = (canvas_size - original.width) // 2
    y_offset = (canvas_size - original.height) // 2

    # Paste the logo in the center
    padded.paste(original, (x_offset, y_offset), original)

    # Save the padded icon
    padded.save(output_path, 'PNG', optimize=True)

    print(f"✓ Padded icon created successfully!")
    print(f"  Original size: {original.width}x{original.height}")
    print(f"  Canvas size: {canvas_size}x{canvas_size}")
    print(f"  Logo occupies: {logo_percentage*100:.0f}% of canvas")
    print(f"  Saved to: {output_path}")

if __name__ == "__main__":
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_icon = os.path.join(script_dir, "assets", "images", "icon.png")
    output_icon = os.path.join(script_dir, "assets", "images", "icon-padded.png")

    # Check if input exists
    if not os.path.exists(input_icon):
        print(f"Error: Icon not found at {input_icon}")
        exit(1)

    # Create padded icon
    add_padding_to_icon(input_icon, output_icon, canvas_size=1024, logo_percentage=0.65)

    print("\nNext steps:")
    print("1. Preview the padded icon: icon-padded.png")
    print("2. If satisfied, update app.json to use the padded version")
    print("3. Or adjust logo_percentage in the script and run again")
