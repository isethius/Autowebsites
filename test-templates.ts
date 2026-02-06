import { generatePlumberTemplate } from "./src/preview/industry-templates/plumber/template";
import { generateConstrainedDNA, VIBES } from "./src/themes/engine/harmony/constraints";
import { PLUMBER_PALETTES } from "./src/preview/industry-templates/index";
import * as fs from "fs";

fs.mkdirSync("dist/template-test", { recursive: true });

const vibeNames = ["maverick", "executive", "friendly", "bold", "playful"];

for (const vibeName of vibeNames) {
  const vibe = VIBES[vibeName];
  if (!vibe) { console.log("Vibe not found: " + vibeName); continue; }
  
  const dna = generateConstrainedDNA(vibe);
  console.log("plumber-" + vibeName + ": D=" + dna.design + " H=" + dna.hero + " T=" + dna.typography);
  
  const html = generatePlumberTemplate({
    businessName: "Elite Plumbing",
    content: {
      headline: "Expert Plumbing Services",
      tagline: "Fast, reliable, professional",
      about: "We have been serving the community for over 20 years. Our team of licensed plumbers provides quality service.",
      services: [
        { name: "Emergency Repairs", description: "24/7 emergency plumbing service" },
        { name: "Drain Cleaning", description: "Professional drain cleaning" },
        { name: "Water Heaters", description: "Installation and repair" },
      ],
      cta_text: "Get a Free Quote",
      contact_text: "Contact us today for fast, reliable service",
      meta_description: "Professional plumbing services",
    },
    palette: PLUMBER_PALETTES[0],
    phone: "(555) 123-4567",
    city: "Austin",
    state: "TX",
    dna,
  });
  
  fs.writeFileSync("dist/template-test/plumber-" + vibeName + ".html", html);
}
console.log("Done! Check dist/template-test/");
