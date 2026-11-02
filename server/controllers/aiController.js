/*import ai from "../configs/ai.js";
import Resume from "../models/Resume.js";

// Controller for enhancing a resume's professional summary
// POST: /api/ai/enhance-pro-sum
export const enhanceProfessionalSummary = async (req, res) => {
  try {
    const { userContent } = req.body;

    if (!userContent) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const response = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an expert in resume writing. Your task is to enhance the professional summary of a resume. The summary should be 1-2 sentences also highlighting key skills, experience, and career objectives. Make it compelling and ATS-friendly. And only return text no options or anything else.",
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    });

    const enhancedContent = response.choices[0].message.content;

    return res.status(200).json({ enhancedContent });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Controller for enhancing a resume's job description
// POST: /api/ai/enhance-job-desc
export const enhanceJobDescription = async (req, res) => {
  try {
    const { userContent } = req.body;

    if (!userContent) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const response = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an expert in resume writing. Your task is to enhance the job description of a resume. The job description should be only in 1-2 sentence also highlighting key responsibilities and achievements. Use action verbs and quantifiable results where possible. Make it ATS-friendly. And only return text no options or anything else.",
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    });

    const enhancedContent = response.choices[0].message.content;

    return res.status(200).json({ enhancedContent });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Controller for uploading a resume to the database
// POST: /api/ai/upload-resume
export const uploadResume = async (req, res) => {
  try {
    const { resumeText, title } = req.body;
    const userId = req.userId;

    if (!resumeText) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const systemPrompt =
      "You are an expert AI Agent to extract data from resume.";

    const userPrompt = `extract data from this resume: ${resumeText}
    
    Provide data in the following JSON format with no additional text before or after:

    {
        professional_summary: { type: String, default: "" },
        skills: [{ type: String }],
        personal_info: {
        image: { type: String, default: "" },
        full_name: { type: String, default: "" },
        profession: { type: String, default: "" },
        email: { type: String, default: "" },
        phone: { type: String, default: "" },
        location: { type: String, default: "" },
        linkedin: { type: String, default: "" },
        website: { type: String, default: "" },
        },
        experience: [
        {
            company: { type: String },
            position: { type: String },
            start_date: { type: String },
            end_date: { type: String },
            description: { type: String },
            is_current: { type: Boolean },
        },
        ],
        project: [
        {
            name: { type: String },
            type: { type: String },
            description: { type: String },
        },
        ],
        education: [
        {
            institution: { type: String },
            degree: { type: String },
            field: { type: String },
            graduation_date: { type: String },
            gpa: { type: String },
        },
        ],
    }
    `;

    const response = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const extractedData = response.choices[0].message.content;
    const parsedData = JSON.parse(extractedData);

    // create new resume in the database
    const newResume = await Resume.create({ userId, title, ...parsedData });

    res.json({ resumeId: newResume._id });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

*/



import Resume from "../models/Resume.js";

const MODEL = "gemini-3.6-flash";

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Reusable Gemini text generation function
const generateAIContent = async (

  systemInstruction,
  userContent,
  jsonMode = false
) => {
  const apiKey = process.env.GEMINI_API_KEY;


  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing from environment variables");
  }

  const requestBody = {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userContent }],
      },
    ],
  };

  if (jsonMode) {
    requestBody.generationConfig = {
      responseMimeType: "application/json",
    };
  }

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("Gemini API error:", result);

    throw new Error(
      result.error?.message || `Gemini API error: ${response.status}`
    );
  }

  const generatedText = result.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("");

  if (!generatedText) {
    throw new Error("Gemini returned an empty response");
  }

  return generatedText;
};

// Enhance professional summary
export const enhanceProfessionalSummary = async (req, res) => {
  try {
    const { userContent } = req.body;

    if (!userContent) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const systemPrompt =
      "You are an expert resume writer. Enhance the professional summary in 1-2 sentences, highlighting key skills, experience, and career objectives. Make it compelling and ATS-friendly. Return only the enhanced text.";

    const enhancedContent = await generateAIContent(
      systemPrompt,
      userContent
    );

    return res.status(200).json({ enhancedContent });
  } catch (error) {
    console.error("Summary enhancement error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// Enhance job description
export const enhanceJobDescription = async (req, res) => {
  try {
    const { userContent } = req.body;

    if (!userContent) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const systemPrompt =
      "You are an expert resume writer. Enhance the job description in 1-2 sentences, highlighting key responsibilities and achievements. Use action verbs and quantifiable results where possible. Make it ATS-friendly. Return only the enhanced text.";

    const enhancedContent = await generateAIContent(
      systemPrompt,
      userContent
    );

    return res.status(200).json({ enhancedContent });
  } catch (error) {
    console.error("Job description enhancement error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// Upload and extract existing resume
export const uploadResume = async (req, res) => {
  try {
    const { resumeText, title } = req.body;
    const userId = req.userId;

    if (!resumeText) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const systemPrompt =
      "You are an expert resume data extraction assistant. Extract information accurately from the supplied resume. Do not invent missing information. Return valid JSON only.";

    const userPrompt = `
Extract structured information from this resume:

${resumeText}

Return JSON using exactly this structure:

{
  "professional_summary": "",
  "skills": [],
  "personal_info": {
    "image": "",
    "full_name": "",
    "profession": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "website": ""
  },
  "experience": [
    {
      "company": "",
      "position": "",
      "start_date": "",
      "end_date": "",
      "description": "",
      "is_current": false
    }
  ],
  "project": [
    {
      "name": "",
      "type": "",
      "description": ""
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "field": "",
      "graduation_date": "",
      "gpa": ""
    }
  ]
}

Use empty strings or empty arrays when information is unavailable.
For is_current, use true only when the resume indicates that the position is current.
`;

    const extractedData = await generateAIContent(
      systemPrompt,
      userPrompt,
      true
    );

    const parsedData = JSON.parse(extractedData);

    // Create new resume in MongoDB
    const newResume = await Resume.create({
      userId,
      title,
      ...parsedData,
    });

    return res.status(200).json({
      resumeId: newResume._id,
    });
  } catch (error) {
    console.error("Resume upload error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};
