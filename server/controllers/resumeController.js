
import imageKit from "../configs/imageKit.js";
import Resume from "../models/Resume.js";
import fs from "fs";

// Controller for creating a new resume
// POST: /api/resumes/create
export const createResume = async (req, res) => {
  try {
    const userId = req.userId;
    const { title } = req.body;

    const newResume = await Resume.create({ userId, title });

    return res.status(201).json({
      message: "Resume created successfully",
      resume: newResume,
    });
  } catch (error) {
    console.error("Create resume error:", error);
    return res.status(400).json({ message: error.message });
  }
};

// Controller for deleting a resume
// DELETE: /api/resumes/delete/:resumeId
export const deleteResume = async (req, res) => {
  try {
    const userId = req.userId;
    const { resumeId } = req.params;

    const deletedResume = await Resume.findOneAndDelete({
      userId,
      _id: resumeId,
    });

    if (!deletedResume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    return res.status(200).json({
      message: "Resume deleted successfully",
    });
  } catch (error) {
    console.error("Delete resume error:", error);
    return res.status(400).json({ message: error.message });
  }
};

// Controller for getting user resume by ID
// GET: /api/resumes/get/:resumeId
export const getResumeById = async (req, res) => {
  try {
    const userId = req.userId;
    const { resumeId } = req.params;

    const resume = await Resume.findOne({
      userId,
      _id: resumeId,
    });

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Hide internal fields
    resume.__v = undefined;
    resume.createdAt = undefined;
    resume.updatedAt = undefined;

    return res.status(200).json({ resume });
  } catch (error) {
    console.error("Get resume error:", error);
    return res.status(400).json({ message: error.message });
  }
};

// Controller for getting a public resume by ID
// GET: /api/resumes/public/:resumeId
export const getPublicResumeById = async (req, res) => {
  try {
    const { resumeId } = req.params;

    const resume = await Resume.findOne({
      public: true,
      _id: resumeId,
    });

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    return res.status(200).json({ resume });
  } catch (error) {
    console.error("Get public resume error:", error);
    return res.status(400).json({ message: error.message });
  }
};

// Controller for updating a resume
// PUT: /api/resumes/update
export const updateResume = async (req, res) => {
  const image = req.file;

  try {
    const userId = req.userId;
    const { resumeId, resumeData, removeBackground } = req.body;

    if (!resumeId || !resumeData) {
      return res.status(400).json({
        message: "Resume ID and resume data are required",
      });
    }

    let resumeDataCopy;

    if (typeof resumeData === "string") {
      resumeDataCopy = JSON.parse(resumeData);
    } else {
      resumeDataCopy = structuredClone(resumeData);
    }

    if (!resumeDataCopy || typeof resumeDataCopy !== "object") {
      return res.status(400).json({
        message: "Invalid resume data",
      });
    }

    if (image) {
      if (!resumeDataCopy.personal_info) {
        resumeDataCopy.personal_info = {};
      }

      const imageBufferData = fs.createReadStream(image.path);

      const response = await imageKit.files.upload({
        file: imageBufferData,
        fileName: "resume.png",
        folder: "user-resumes",
        transformation: {
          pre:
            "w-300,h-300,fo-face,z-0.75" +
            (removeBackground ? ",e-bgremove" : ""),
        },
      });

      resumeDataCopy.personal_info.image = response.url;
    }

    const resume = await Resume.findOneAndUpdate(
      {
        userId,
        _id: resumeId,
      },
      resumeDataCopy,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found",
      });
    }

    return res.status(200).json({
      message: "Saved successfully",
      resume,
    });
  } catch (error) {
    console.error("Update resume error:", error);

    return res.status(400).json({
      message: error.message,
    });
  } finally {
    // Delete the temporary file saved by Multer
    if (image?.path) {
      fs.unlink(image.path, (error) => {
        if (error) {
          console.error("Temporary image cleanup failed:", error);
        }
      });
    }
  }
};
