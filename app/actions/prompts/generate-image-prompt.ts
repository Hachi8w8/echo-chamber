export const generateImagePromptTemplate = `
Your task is to create a single character image suitable for an avatar. The character must be a resident of the world defined in the following <Worldview Setting>:
{worldviewDescription}

Follow these guidelines:
- **Strict Subject Matter**: The generated image must never be a landscape, an object, or an abstract scene. The subject must always be a single character.
- **Interpretation**: Use the <Worldview Setting> as inspiration for determining the character's design (appearance, clothing, equipment, etc.) and atmosphere. Even if the text describes a landscape, never draw a landscape.
- **Composition**: The character must be the main subject, occupying over 80% of the image. Use a full-body or upper-body shot.
- **Style**: Define and apply an art style (e.g., fantasy, sci-fi, surreal, photorealistic, cel-shaded, vaporwave, whimsical, dark fantasy, utopian, dystopian, etc.) that matches the <Worldview Setting>.
- **Pose**: Create a dynamic and engaging pose for the character.
- **Background**: Use a simple and clean background that complements the character without distracting from them.
- **Color Palette**: Apply a color palette that matches the <Worldview Setting>.
- **Lighting**: Apply lighting conditions that enhance the character's form and create visual interest.
- **aspect**: 1:1
`;