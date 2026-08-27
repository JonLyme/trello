import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { submitFile } from "../features/file/fileSlice.js";
import { fetchMe } from "../features/auth/authSlice.js";

export default function FileUpload({ setResumeName, setResumeUrl }) {
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);

  const pick = (selected) => {
    if (!selected) return;
    if (selected.type !== "application/pdf")
      return toast.error("Please choose a PDF file.");
    if (selected.size > 5 * 1024 * 1024)
      return toast.error("The PDF must be smaller than 5 MB.");
    setFile(selected);
  };

  const upload = async (event) => {
    event.preventDefault();
    if (!file) return toast.error("Choose a PDF first.");
    const data = new FormData();
    data.append("file", file);
    setUploading(true);
    const result = await dispatch(submitFile(data));
    setUploading(false);
    if (submitFile.fulfilled.match(result)) {
      setResumeName(result.payload.originalName || file.name);
      setResumeUrl(result.payload.url);
      dispatch(fetchMe());
      toast.success("Resume uploaded successfully");
      setFile(null);
    } else toast.error(result.payload || "Upload failed");
  };

  return (
    <form onSubmit={upload} className='upload-modern'>
      <div className='section-heading'>
        <div>
          <span className='eyebrow'>Resume</span>
          <h2>Upload document</h2>
        </div>
        <span className='secure-chip'>PDF · 5 MB</span>
      </div>
      <motion.button
        type='button'
        className={`drop-zone ${drag ? "dragging" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          pick(e.dataTransfer.files?.[0]);
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          ref={inputRef}
          type='file'
          hidden
          accept='application/pdf'
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <span className='upload-icon'>↥</span>
        <strong>{file ? file.name : "Drop your resume here"}</strong>
        <small>
          {file
            ? `${Math.ceil(file.size / 1024)} KB ready to upload`
            : "Drag and drop or click to browse"}
        </small>
      </motion.button>
      <button
        className='button button-primary full'
        disabled={uploading || !file}
      >
        {uploading ? (
          <>
            <span className='button-loader' /> Uploading
          </>
        ) : (
          "Upload resume"
        )}
      </button>
    </form>
  );
}
