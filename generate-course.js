export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { skill, category } = req.body;

  if (!skill || !category) {
    return res.status(400).json({ error: 'Missing skill or category' });
  }

  const apiKey = process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  try {
    const prompt = `You are an expert course creator. Generate a structured 5-lesson microlearning course for someone wanting to learn: "${skill}" (Category: ${category})

Format your response as VALID JSON only (no markdown, no extra text). Use this exact structure:

{
  "title": "Course Title Here",
  "description": "Brief description",
  "duration": "25 minutes",
  "lessons": [
    {
      "number": 1,
      "title": "Lesson Title",
      "duration": "5 min",
      "content": "Detailed lesson content with 2-3 paragraphs of clear, actionable information",
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "quiz": {
        "question": "A learning question",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct": 0
      }
    },
    {
      "number": 2,
      "title": "Second Lesson Title",
      "duration": "5 min",
      "content": "Detailed lesson content with 2-3 paragraphs of clear, actionable information",
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "quiz": {
        "question": "A learning question",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct": 1
      }
    },
    {
      "number": 3,
      "title": "Third Lesson Title",
      "duration": "5 min",
      "content": "Detailed lesson content with 2-3 paragraphs of clear, actionable information",
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "quiz": {
        "question": "A learning question",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct": 2
      }
    },
    {
      "number": 4,
      "title": "Fourth Lesson Title",
      "duration": "5 min",
      "content": "Detailed lesson content with 2-3 paragraphs of clear, actionable information",
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "quiz": {
        "question": "A learning question",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct": 0
      }
    },
    {
      "number": 5,
      "title": "Fifth Lesson Title",
      "duration": "5 min",
      "content": "Detailed lesson content with 2-3 paragraphs of clear, actionable information",
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "quiz": {
        "question": "A learning question",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct": 3
      }
    }
  ]
}

Make sure:
- Each lesson is 5 minutes worth of content (2-3 solid paragraphs)
- Content is specific, actionable, and practical
- Quiz questions test understanding of that lesson
- Options are realistic and plausible
- The course is complete and self-contained
- JSON is valid and parseable
- Correct answer index matches the correct option (0-3)`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-1',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Claude API error:', errorData);
      return res.status(response.status).json({
        error: errorData.error?.message || 'Failed to generate course'
      });
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Invalid response format from Claude' });
    }

    const course = JSON.parse(jsonMatch[0]);

    return res.status(200).json(course);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate course'
    });
  }
}