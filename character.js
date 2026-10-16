/**
 * Dynamic Start.ng Character Canvas Renderer
 * Draws the player runner customized according to start.ng player style:
 * body, primaryColor, secondaryColor, skinColor, hairColor, hair, hat, accessory.
 */

export function drawCharacter(ctx, x, y, width, height, state, style) {
  ctx.save();
  ctx.translate(x, y);

  const {
    isGrounded = true,
    isSlashing = false,
    slashProgress = 0,
    animTime = 0,
  } = state;

  const s = {
    body: style?.body || "female",
    primaryColor: style?.primaryColor || "#00f0ff", // jacket/torso
    secondaryColor: style?.secondaryColor || "#ff007f", // legs/pants
    skinColor: style?.skinColor || "#e0ac69",
    hairColor: style?.hairColor || "#ffe600",
    hair: style?.hair || "short",
    hat: style?.hat || "none",
    accessory: style?.accessory || "glasses",
  };

  // Base runner scale (standard bounding box ~48x64)
  const scaleX = width / 48;
  const scaleY = height / 64;
  ctx.scale(scaleX, scaleY);

  // Running bounce cycle
  const runCycle = Math.sin(animTime * 14);
  const legCycle = Math.sin(animTime * 14);
  const bounceY = isGrounded ? Math.abs(runCycle) * 3 : 0;

  // 1. Shadow beneath character
  if (isGrounded) {
    ctx.save();
    ctx.fillStyle = "rgba(0, 240, 255, 0.25)";
    ctx.beginPath();
    ctx.ellipse(24, 62, 18, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. Backpack (if accessory is backpack)
  if (s.accessory === "backpack") {
    ctx.fillStyle = "#1e272e";
    ctx.strokeStyle = s.primaryColor;
    ctx.lineWidth = 1.5;
    ctx.fillRect(8, 24 - bounceY, 8, 16);
    ctx.strokeRect(8, 24 - bounceY, 8, 16);
  }

  // 3. Legs
  ctx.fillStyle = s.secondaryColor;
  if (isGrounded) {
    // Back leg
    ctx.save();
    ctx.translate(20, 38 - bounceY);
    ctx.rotate(legCycle * 0.45);
    ctx.fillRect(-3, 0, 6, 20);
    // Boot
    ctx.fillStyle = "#11141a";
    ctx.fillRect(-3, 16, 8, 5);
    ctx.restore();

    // Front leg
    ctx.save();
    ctx.translate(28, 38 - bounceY);
    ctx.rotate(-legCycle * 0.45);
    ctx.fillStyle = s.secondaryColor;
    ctx.fillRect(-3, 0, 6, 20);
    // Boot
    ctx.fillStyle = "#11141a";
    ctx.fillRect(-3, 16, 8, 5);
    ctx.restore();
  } else {
    // Airborne tucked jump pose
    ctx.save();
    ctx.translate(20, 38 - bounceY);
    ctx.rotate(-0.5);
    ctx.fillRect(-3, 0, 6, 16);
    ctx.fillStyle = "#11141a";
    ctx.fillRect(-3, 13, 8, 5);
    ctx.restore();

    ctx.save();
    ctx.translate(28, 38 - bounceY);
    ctx.rotate(0.3);
    ctx.fillStyle = s.secondaryColor;
    ctx.fillRect(-3, 0, 6, 16);
    ctx.fillStyle = "#11141a";
    ctx.fillRect(-3, 13, 8, 5);
    ctx.restore();
  }

  // 4. Torso / Cyber Jacket (primaryColor)
  ctx.save();
  ctx.fillStyle = s.primaryColor;
  ctx.shadowColor = s.primaryColor;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.roundRect(16, 22 - bounceY, 16, 18, 4);
  ctx.fill();
  ctx.restore();

  // Torso cyber details (neon zipper / plates)
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(24, 23 - bounceY);
  ctx.lineTo(24, 40 - bounceY);
  ctx.stroke();

  // Scarf (accessory)
  if (s.accessory === "scarf") {
    ctx.fillStyle = "#ff3838";
    ctx.fillRect(16, 20 - bounceY, 16, 5);
    // Flying scarf tail
    ctx.beginPath();
    ctx.moveTo(16, 22 - bounceY);
    ctx.lineTo(6, 25 - bounceY + runCycle * 2);
    ctx.lineTo(16, 25 - bounceY);
    ctx.fill();
  }

  // 5. Head
  ctx.fillStyle = s.skinColor;
  ctx.beginPath();
  ctx.arc(24, 14 - bounceY, 8, 0, Math.PI * 2);
  ctx.fill();

  // Beard (accessory)
  if (s.accessory === "beard") {
    ctx.fillStyle = s.hairColor;
    ctx.beginPath();
    ctx.arc(24, 16 - bounceY, 7, 0.2, Math.PI - 0.2);
    ctx.fill();
  }

  // Glasses / Cyber Visor (accessory)
  if (s.accessory === "glasses") {
    ctx.fillStyle = "#00ffff";
    ctx.shadowColor = "#00ffff";
    ctx.shadowBlur = 6;
    ctx.fillRect(23, 12 - bounceY, 9, 3);
  } else {
    // Normal eye
    ctx.fillStyle = "#111";
    ctx.fillRect(27, 13 - bounceY, 2, 2);
  }

  // Earrings (accessory)
  if (s.accessory === "earrings") {
    ctx.fillStyle = "#ffd32a";
    ctx.beginPath();
    ctx.arc(19, 16 - bounceY, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Hair Styles
  ctx.fillStyle = s.hairColor;
  switch (s.hair) {
    case "afro":
      ctx.beginPath();
      ctx.arc(23, 11 - bounceY, 11, 0, Math.PI * 2);
      ctx.fill();
      // Re-draw head center
      ctx.fillStyle = s.skinColor;
      ctx.beginPath();
      ctx.arc(24, 14 - bounceY, 7.5, 0, Math.PI * 2);
      ctx.fill();
      break;

    case "braids":
    case "dreads":
      ctx.beginPath();
      ctx.arc(23, 11 - bounceY, 8.5, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(15, 11 - bounceY, 5, 12);
      ctx.fillRect(18, 11 - bounceY, 4, 10);
      break;

    case "ponytail":
      ctx.beginPath();
      ctx.arc(24, 12 - bounceY, 8.5, Math.PI * 0.9, 0);
      ctx.fill();
      ctx.fillRect(12, 10 - bounceY + runCycle, 7, 5);
      break;

    case "bun":
      ctx.beginPath();
      ctx.arc(24, 12 - bounceY, 8.5, Math.PI * 0.9, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(20, 5 - bounceY, 4, 0, Math.PI * 2);
      ctx.fill();
      break;

    case "bald":
      // No extra hair
      break;

    case "short":
    default:
      ctx.beginPath();
      ctx.arc(24, 12 - bounceY, 8.5, Math.PI * 0.85, 0);
      ctx.fill();
      break;
  }

  // 7. Hats
  switch (s.hat) {
    case "cap":
      ctx.fillStyle = "#ff0055";
      ctx.fillRect(18, 6 - bounceY, 13, 5);
      ctx.fillRect(25, 10 - bounceY, 9, 2); // visor
      break;
    case "beanie":
      ctx.fillStyle = "#0be881";
      ctx.beginPath();
      ctx.arc(24, 9 - bounceY, 9, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(15, 9 - bounceY, 18, 4);
      break;
    case "tophat":
      ctx.fillStyle = "#1e272e";
      ctx.fillRect(14, 8 - bounceY, 20, 2);
      ctx.fillRect(17, -2 - bounceY, 14, 10);
      ctx.fillStyle = s.primaryColor;
      ctx.fillRect(17, 6 - bounceY, 14, 2);
      break;
    case "crown":
      ctx.fillStyle = "#ffd32a";
      ctx.beginPath();
      ctx.moveTo(17, 8 - bounceY);
      ctx.lineTo(17, 1 - bounceY);
      ctx.lineTo(20, 5 - bounceY);
      ctx.lineTo(24, 0 - bounceY);
      ctx.lineTo(28, 5 - bounceY);
      ctx.lineTo(31, 1 - bounceY);
      ctx.lineTo(31, 8 - bounceY);
      ctx.closePath();
      ctx.fill();
      break;
    case "none":
    default:
      break;
  }

  // 8. Arms and Plasma Katana Sword
  if (isSlashing) {
    // Slashing strike animation
    ctx.save();
    ctx.translate(28, 25 - bounceY);
    ctx.rotate(0.5 - slashProgress * 1.8);

    // Arm
    ctx.fillStyle = s.primaryColor;
    ctx.fillRect(0, -3, 14, 5);

    // Plasma Katana
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#ff007f";
    ctx.shadowBlur = 12;
    ctx.fillRect(14, -2, 28, 4);

    // Hilt
    ctx.fillStyle = "#ffd32a";
    ctx.shadowBlur = 0;
    ctx.fillRect(12, -4, 4, 8);
    ctx.restore();

    // Radiant slash energy arc
    ctx.save();
    ctx.strokeStyle = "#ff007f";
    ctx.shadowColor = "#00f0ff";
    ctx.shadowBlur = 16;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(28, 25 - bounceY, 36, -0.8 + slashProgress * 0.4, 0.8 + slashProgress * 0.4);
    ctx.stroke();
    ctx.restore();
  } else {
    // Normal running arm with sword resting
    ctx.save();
    ctx.translate(28, 25 - bounceY);
    ctx.rotate(-0.4 + legCycle * 0.3);

    // Arm
    ctx.fillStyle = s.primaryColor;
    ctx.fillRect(0, -2, 12, 5);

    // Glowing Katana resting back
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#00f0ff";
    ctx.shadowBlur = 8;
    ctx.fillRect(12, -2, 22, 3);
    // Hilt
    ctx.fillStyle = "#ffd32a";
    ctx.shadowBlur = 0;
    ctx.fillRect(10, -4, 3, 7);
    ctx.restore();
  }

  ctx.restore();
}
