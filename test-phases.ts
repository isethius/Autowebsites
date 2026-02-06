import { buildWebsite, SiteContent } from "./src/themes/engine/site-builder";
import { generateConstrainedDNA, VIBES } from "./src/themes/engine/harmony/constraints";
import * as fs from "fs";

const tests = [
  { industry: "plumber", vibe: "maverick" },
  { industry: "lawyer", vibe: "executive" },
  { industry: "dentist", vibe: "friendly" },
  { industry: "photographer", vibe: "creative" },
  { industry: "gym", vibe: "bold" },
];

fs.mkdirSync("dist/phase-test", { recursive: true });

for (const test of tests) {
  const vibe = VIBES[test.vibe];
  if (!vibe) {
    console.log("Vibe " + test.vibe + " not found");
    continue;
  }

  const dna = generateConstrainedDNA(vibe);
  console.log(test.industry + "-" + test.vibe + ": D=" + dna.design + " R=" + dna.radius + " T=" + dna.typography);

  const content: SiteContent = {
    industry: test.industry,
    businessName: test.industry.charAt(0).toUpperCase() + test.industry.slice(1) + " Pro",
    tagline: "Your trusted " + test.industry + " service",
    contact: { phone: "(555) 123-4567", city: "Phoenix", state: "AZ" },
    services: [
      { name: "Service 1", description: "Premium service" },
      { name: "Service 2", description: "Expert service" },
      { name: "Service 3", description: "Quality service" },
    ],
  };

  const html = buildWebsite(content, { dna, vibe: test.vibe });
  fs.writeFileSync("dist/phase-test/" + test.industry + "-" + test.vibe + ".html", html);
}
console.log("Done!");
