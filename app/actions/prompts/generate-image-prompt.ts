export const generateImagePromptTemplate = `
# Instructions
Using ONLY the text provided in the <World Setting> below as your source of information, create a single character that **lives in** that world setting and generate an image of that character.

# Absolute Rules
- **Strict Subject Matter**: The generated image must **NEVER** be a landscape, an object, or an abstract scene. The subject must **ALWAYS** be a **single character**.
- **Composition**: The character's **upper body or full body** must be depicted prominently in the center of the image. The character must be the main subject and occupy the majority of the frame.
- **Background**: Do not draw a background. The background must be **white or transparent**. Prioritizing making the character stand out is the highest priority.
- **Interpretation**: Use the <World Setting> **only** as inspiration to determine the character's **design (appearance, clothing, equipment, etc.)** and **atmosphere**. Even if the text describes a landscape, you must absolutely not draw that landscape.

# Input Information
- **<World Setting>**:
{worldviewDescription}
`;