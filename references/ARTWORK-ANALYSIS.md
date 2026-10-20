# Artwork Analysis Guide (Generative & On-Chain Art)

To critique or describe an artwork authoritatively, inspect the actual visual asset. Do not hallucinate traits, colors, or styles.

---

## 1. Strict Anti-Hallucination & Specification Guard
- **NEVER invent visual specifications:** Do not invent grid dimensions (e.g. 12×12, 16×16, 24×24), palette counts, trait counts, or compositional geometry.
- **Rule of Evidence:** You may cite visual dimensions and colors **only if**:
  1. Verified by decoding the actual SVG/metadata from `tokenURI`.
  2. Explicitly supplied in user-provided context or verified studio documentation.
  3. Clearly and unambiguously designated as a hypothetical assumption (e.g., in illustrative critiques).
- If the artwork cannot be inspected, state plainly:
  *"Artwork visual data uninspected. Analysis is restricted to verified contract mechanics and artist notes."*

---

## 2. Retrieval Pipeline
1. **Query Token URI:** Call `tokenURI(tokenId) view returns (string)`.
2. **Decode Metadata:**
   - If `data:application/json;base64,...`: decode JSON to extract `name`, `description`, `attributes`, and `image`.
   - If `image` is `data:image/svg+xml;base64,...`: decode base64 to read raw SVG markup.
3. **If Web Image / Token Page:** Fetch the verified token card or OpenGraph preview from `https://mintbay.fun/collections/{chainId}/{contract}/{tokenId}/opengraph-image`.

---

## 3. Visual Analysis Framework

### A. Formal Constraints & Structure
- **Grid Resolution:** Measure viewBox or rect distributions only when SVG markup is decoded.
- **Restraint vs. Complexity:** Evaluate how cells are occupied and how negative space functions.
- **Silhouette Readability:** Does the character or form remain readable at thumbnail scale?

### B. Color Theory & Palette Discipline
- **Palette Size:** Count unique hex codes in `<rect fill="...">`. Avoid guessing palette limits.
- **Contrast & Hierarchy:** Does background contrast sharply against the subject, or is there tonal vibration?
- **Texture & Lighting:** Are shadow and highlight represented by dithering, single-pixel accents, or flat blocks?

### C. Generative Logic & Composition
- **Trait Layering:** How do background, body, expression, and accessories interact?
- **Visual Tension:** Do overlapping traits create awkward collisions or intentional graphic friction?
- **Variety vs. Cohesion:** Does the generator produce distinct variations, or do traits feel like minor cosmetic swaps?

---

## 4. Separating Fact from Interpretation
- **Visual Fact:** "The decoded SVG specifies a 12×12 grid with five distinct hex fills on a `#151614` background."
- **Artistic Interpretation:** "The narrow color range gives the character an austere, archival quality."
- **Creator Lore:** Only attribute meaning to the artist if quoted or documented in verified studio notes.
