export const generateImagePromptTemplate = `
# Instructions
Primary Goal: Generate an Image
Your only task is to generate one image. Do not write any text, descriptions, or explanations. Your entire output must be the image file.

Image Content:
Generate a single, standalone character avatar.
This character must be designed as if they are an inhabitant of the world detailed in the {Worldview Description} below.
The character's appearance, clothing, and overall style must be a direct reflection of the themes, aesthetics, and mood of that specific world.
The avatar should prominently feature the character, with the character taking up a significant portion of the image frame.
Image Specifications:

Focus: The character must be the clear and dominant focus of the image.
Composition Suggestion: Consider a close-up or medium shot of the character to ensure they are the primary visual element. The background should be simple or blurred to further emphasize the character.

# Worldview Description
{worldviewDescription}
`;