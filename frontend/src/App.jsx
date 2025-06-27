import { useState, useEffect } from 'react'
import './App.css'
import Calendar from './components/Calendar'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [clearStatus, setClearStatus] = useState('');
  const [deleteStatus, setDeleteStatus] = useState('');

  // Fetch the list of PDFs when the component mounts
  useEffect(() => {
    fetchPdfList();
  }, []);

  // Function to fetch and display the list of PDFs
  const fetchPdfList = async () => {
    try {
      const response = await fetch(`${API_URL}/pdfs`);
      const files = await response.json();
      setPdfFiles(files);
    } catch (err) {
      console.error('Error fetching PDF list:', err);
    }
  };

  // Handle file selection
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('pdfFile', selectedFile);

    setUploadStatus('Uploading...');

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setUploadStatus('Upload successful!');
        setSelectedFile(null);
        // Reset file input
        event.target.reset();
        // Refresh the list
        fetchPdfList();
      } else {
        const errorText = await response.text();
        setUploadStatus(`Upload failed: ${errorText}`);
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setUploadStatus('Upload failed. Please try again.');
    }
  };

  // Handle deleting a single PDF
  const handleDeletePdf = async (fileId, filename) => {
    if (window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      try {
        const response = await fetch(`${API_URL}/pdfs/${fileId}/delete`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setDeleteStatus(`Successfully deleted ${filename}`);
          // Remove the deleted file from the state
          setPdfFiles(pdfFiles.filter(file => file._id !== fileId));
        } else {
          const errorText = await response.text();
          setDeleteStatus(`Failed to delete: ${errorText}`);
        }
      } catch (err) {
        console.error('Error deleting PDF:', err);
        setDeleteStatus('Failed to delete PDF. Please try again.');
      }
    }
  };

  // Handle clearing all PDFs
  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all PDFs?')) {
      try {
        console.log('Starting clear all operation...');
        const response = await fetch(`${API_URL}/pdfs/clear`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          console.log('Clear operation successful');
          setClearStatus('All PDFs cleared successfully');
          setPdfFiles([]);
        } else {
          const errorText = await response.text();
          console.log('Clear operation failed:', errorText);
          setClearStatus(`Failed to clear PDFs: ${errorText}`);
        }
      } catch (err) {
        console.error('Error clearing PDFs:', err);
        setClearStatus('Failed to clear PDFs. Please try again.');
      }
    }
  };

  useEffect(() => {
    console.log('clearStatus changed:', clearStatus);
  }, [clearStatus]);

  return (
    <div className="container">
      <h1>Learning Penguin</h1>
      
      <div className="main-content">
        <div className="left-panel">
          <div className="upload-form">
            <h2>Upload a PDF</h2>
            <form onSubmit={handleSubmit}>
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileChange}
                required 
              />
              <button type="submit">Upload</button>
            </form>
            {uploadStatus && <p className="upload-status">{uploadStatus}</p>}
          </div>

          <div className="file-list">
            <h2>Uploaded PDFs</h2>
            {clearStatus && (
              <p className={`clear-status ${clearStatus.startsWith('Failed') ? 'error' : ''}`}>
                {clearStatus}
              </p>
            )}
            {deleteStatus && (
              <p className={`delete-status ${deleteStatus.startsWith('Failed') ? 'error' : ''}`}>
                {deleteStatus}
              </p>
            )}
            {pdfFiles.length === 0 ? (
              <p>No PDFs uploaded yet.</p>
            ) : (
              <>
                <button onClick={handleClearAll} className="clear-button">Clear All PDFs</button>
                {pdfFiles.map((file) => (
                  <div key={file._id} className="file-item">
                    <span className="file-name">{file.originalname}</span>
                    <button 
                      onClick={() => handleDeletePdf(file._id, file.originalname)}
                      className="delete-button"
                      title="Delete PDF"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="right-panel">
          <Calendar />
        </div>
      </div>
    </div>
  )
}

export default App
